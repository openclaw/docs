---
read_when:
    - Потрібно знати, з якого підшляху SDK виконувати імпорт
    - Вам потрібна довідка щодо всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK overview
summary: Карта імпортів, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-29T04:42:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7652c2be756dad14792f59f36fa2fc2becd1681454005cf391e401b89999b857
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin є типізованим контрактом між плагінами та ядром. Ця сторінка є довідником щодо того, **що імпортувати** і **що можна реєструвати**.

<Tip>
Шукаєте натомість практичний посібник? Почніть із [Створення плагінів](/uk/plugins/building-plugins), використовуйте [Плагіни каналів](/uk/plugins/sdk-channel-plugins) для плагінів каналів, [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) для плагінів провайдерів і [Хуки Plugin](/uk/plugins/hooks) для плагінів інструментів або хуків життєвого циклу.
</Tip>

## Угода про імпорт

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях є невеликим самодостатнім модулем. Це забезпечує швидкий запуск і
запобігає проблемам із циклічними залежностями. Для допоміжних засобів входу/збірки,
специфічних для каналів, віддавайте перевагу `openclaw/plugin-sdk/channel-core`; залиште `openclaw/plugin-sdk/core` для
ширшої узагальнювальної поверхні та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

Для конфігурації каналу публікуйте JSON Schema, що належить каналу, через
`openclaw.plugin.json#channelConfigs`. Підшлях `plugin-sdk/channel-config-schema`
призначений для спільних примітивів схем і загального конструктора. Вбудовані
плагіни OpenClaw використовують `plugin-sdk/bundled-channel-config-schema` для збережених
схем вбудованих каналів. Застарілі експорти сумісності залишаються в
`plugin-sdk/channel-config-schema-legacy`; жоден із підшляхів вбудованих схем не є
шаблоном для нових плагінів.

<Warning>
  Не імпортуйте зручні seams із брендингом провайдера або каналу (наприклад,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані плагіни компонують загальні підшляхи SDK у власних barrel-файлах `api.ts` /
  `runtime-api.ts`; споживачі ядра мають або використовувати ці локальні для плагіна
  barrel-файли, або додати вузький загальний контракт SDK, коли потреба справді є
  міжканальною.

Невеликий набір допоміжних seams вбудованих плагінів досі з'являється у згенерованій мапі експортів,
коли для них відстежується використання власником. Вони існують лише для
супроводу вбудованих плагінів і не рекомендовані як шляхи імпорту для нових сторонніх
плагінів.

`openclaw/plugin-sdk/discord` і `openclaw/plugin-sdk/telegram-account` також
збережені як застарілі фасади сумісності для відстежуваного використання власником. Не
копіюйте ці шляхи імпорту в нові плагіни; натомість використовуйте ін'єктовані runtime-допоміжні засоби та
загальні підшляхи SDK каналів.
</Warning>

## Довідник підшляхів

SDK Plugin надається як набір вузьких підшляхів, згрупованих за областями (вхід
плагіна, канал, провайдер, автентифікація, runtime, capability, пам'ять і зарезервовані
допоміжні засоби вбудованих плагінів). Повний каталог — згрупований і з посиланнями — див.
[Підшляхи SDK Plugin](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів розміщено в `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Callback `register(api)` отримує об'єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація capability

| Метод                                            | Що він реєструє                        |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Текстове виведення (LLM)               |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний backend виведення CLI        |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями            |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT            |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео           |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                    |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                       |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                        |
| `api.registerWebFetchProvider(...)`              | Провайдер веботримання / скрейпінгу    |
| `api.registerWebSearchProvider(...)`             | Вебпошук                               |

### Інструменти та команди

| Метод                           | Що він реєструє                                  |
| ------------------------------- | ------------------------------------------------ |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов'язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (оминає LLM)               |

Команди Plugin можуть задавати `agentPromptGuidance`, коли агенту потрібна коротка,
належна команді підказка маршрутизації. Тримайте цей текст про саму команду; не додавайте
політику, специфічну для провайдера або плагіна, до конструкторів core prompt.

### Інфраструктура

| Метод                                          | Що він реєструє                         |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Хук події                               |
| `api.registerHttpRoute(params)`                | HTTP endpoint Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод Gateway                       |
| `api.registerGatewayDiscoveryService(service)` | Оголошувач локального виявлення Gateway |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                          |
| `api.registerService(service)`                 | Фоновий сервіс                          |
| `api.registerInteractiveHandler(registration)` | Інтерактивний обробник                  |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime middleware результатів інструментів |
| `api.registerMemoryPromptSupplement(builder)`  | Додатковий розділ prompt поруч із пам'яттю |
| `api.registerMemoryCorpusSupplement(adapter)`  | Додатковий корпус пошуку/читання пам'яті |

### Хост-хуки для плагінів workflow

Хост-хуки — це seams SDK для плагінів, яким потрібно брати участь у життєвому циклі хоста,
а не лише додавати провайдера, канал або інструмент. Вони є
загальними контрактами; Plan Mode може їх використовувати, але так само можуть workflow затверджень,
гейти політик робочого простору, фонові монітори, майстри налаштування та супровідні UI
плагіни.

| Метод                                                                    | Контракт, яким він володіє                                                          |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Належний Plugin JSON-сумісний стан сесії, проєктований через сесії Gateway          |
| `api.enqueueNextTurnInjection(...)`                                      | Стійкий контекст exactly-once, ін'єктований у наступний хід агента для однієї сесії |
| `api.registerTrustedToolPolicy(...)`                                     | Політика інструментів до Plugin для вбудованих/довірених інструментів, що може блокувати або переписувати параметри інструмента |
| `api.registerToolMetadata(...)`                                          | Метадані відображення каталогу інструментів без зміни реалізації інструмента        |
| `api.registerCommand(...)`                                               | Обмежені за scope команди Plugin; результати команд можуть задавати `continueAgent: true` |
| `api.registerControlUiDescriptor(...)`                                   | Дескриптори внеску Control UI для поверхонь сесії, інструмента, запуску або налаштувань |
| `api.registerRuntimeLifecycle(...)`                                      | Callback-и очищення для належних Plugin runtime-ресурсів на шляхах reset/delete/reload |
| `api.registerAgentEventSubscription(...)`                                | Санітизовані підписки на події для стану workflow та моніторів                      |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Належний Plugin scratch-стан для кожного запуску, очищений у термінальному життєвому циклі запуску |
| `api.registerSessionSchedulerJob(...)`                                   | Належні Plugin записи завдань планувальника сесій із детермінованим очищенням       |

Контракти навмисно розділяють повноваження:

- Зовнішні плагіни можуть володіти розширеннями сесій, UI-дескрипторами, командами, метаданими інструментів, ін'єкціями наступного ходу та звичайними хуками.
- Довірені політики інструментів виконуються перед звичайними хуками `before_tool_call` і доступні лише для вбудованих компонентів, бо беруть участь у політиці безпеки хоста.
- Зарезервоване володіння командами доступне лише для вбудованих компонентів. Зовнішні плагіни мають використовувати власні назви команд або псевдоніми.
- `allowPromptInjection=false` вимикає хуки, що змінюють prompt, включно з
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  полями prompt із застарілого `before_agent_start` і
  `enqueueNextTurnInjection`.

Приклади споживачів, що не належать до Plan:

| Архетип Plugin                | Використані хуки                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow затвердження         | Розширення сесії, продовження команди, ін'єкція наступного ходу, UI-дескриптор                                                        |
| Гейт політики бюджету/робочого простору | Довірена політика інструментів, метадані інструментів, проєкція сесії                                                        |
| Фоновий монітор життєвого циклу | Очищення runtime-життєвого циклу, підписка на події агента, володіння/очищення планувальника сесій, внесок Heartbeat prompt, UI-дескриптор |
| Майстер налаштування або onboarding | Розширення сесії, обмежені за scope команди, дескриптор Control UI                                                              |

<Note>
  Зарезервовані core admin namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо Plugin намагається призначити
  вужчий scope методу gateway. Віддавайте перевагу префіксам, специфічним для Plugin, для
  методів, якими володіє Plugin.
</Note>

<Accordion title="Коли використовувати middleware результатів інструментів">
  Вбудовані плагіни можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
  їм потрібно переписати результат інструмента після виконання і до того, як runtime
  передасть цей результат назад у модель. Це довірений runtime-нейтральний
  seam для асинхронних редукторів виводу, таких як tokenjuice.

Вбудовані плагіни мають оголошувати `contracts.agentToolResultMiddleware` для кожного
цільового runtime, наприклад `["pi", "codex"]`. Зовнішні плагіни
не можуть реєструвати це middleware; залишайте звичайні хуки Plugin OpenClaw для роботи,
яка не потребує timing результату інструмента до моделі. Старий вбудований
шлях реєстрації фабрики розширення лише для Pi було видалено.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дає Plugin змогу оголошувати активний
Gateway на локальному транспорті виявлення, наприклад mDNS/Bonjour. OpenClaw викликає
сервіс під час запуску Gateway, коли локальне виявлення увімкнене, передає
поточні порти Gateway і несекретні TXT hint-дані, а також викликає повернений
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

Плагіни виявлення Gateway не повинні трактувати оголошені TXT-значення як секрети або
автентифікацію. Виявлення є routing hint; автентифікація Gateway і TLS pinning і далі
відповідають за довіру.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє реєстратор
- `descriptors`: дескриптори команд часу розбору, які використовуються для довідки кореневого CLI,
  маршрутизації та лінивої реєстрації CLI Plugin

Якщо ви хочете, щоб команда Plugin залишалася ліниво завантажуваною у звичайному кореневому шляху CLI,
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

Використовуйте `commands` окремо лише тоді, коли вам не потрібна лінива реєстрація кореневого CLI.
Цей енергійний шлях сумісності й надалі підтримується, але він не встановлює
заповнювачі на основі дескрипторів для лінивого завантаження під час розбору.

### Реєстрація бекенду CLI

`api.registerCliBackend(...)` дає Plugin змогу володіти типовою конфігурацією для локального
бекенду AI CLI, такого як `codex-cli`.

- `id` бекенду стає префіксом провайдера в посиланнях на моделі на кшталт `codex-cli/gpt-5`.
- `config` бекенду використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  типових налаштувань Plugin перед запуском CLI.
- Використовуйте `normalizeConfig`, коли бекенду потрібні переписування для сумісності після об’єднання
  (наприклад, нормалізація старих форм прапорців).

### Ексклюзивні слоти

| Метод                                      | Що він реєструє                                                                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Контекстний рушій (одночасно активний лише один). Зворотний виклик `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг адаптувати доповнення до промпта. |
| `api.registerMemoryCapability(capability)` | Уніфікована можливість пам’яті                                                                                                                                     |
| `api.registerMemoryPromptSection(builder)` | Побудовник секції промпта пам’яті                                                                                                                                  |
| `api.registerMemoryFlushPlan(resolver)`    | Резолвер плану скидання пам’яті                                                                                                                                    |
| `api.registerMemoryRuntime(runtime)`       | Адаптер середовища виконання пам’яті                                                                                                                               |

### Адаптери ембедингів пам’яті

| Метод                                          | Що він реєструє                                |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер ембедингів пам’яті для активного Plugin |

- `registerMemoryCapability` — рекомендований ексклюзивний API Plugin пам’яті.
- `registerMemoryCapability` також може надавати `publicArtifacts.listArtifacts(...)`,
  щоб супровідні Plugins могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core`, а не звертатися до приватної структури
  конкретного Plugin пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це сумісні зі спадщиною ексклюзивні API Plugin пам’яті.
- `MemoryFlushPlan.model` може прив’язати хід скидання до точного посилання
  `provider/model`, такого як `ollama/qwen3:8b`, без успадкування активного
  ланцюжка резервних варіантів.
- `registerMemoryEmbeddingProvider` дає активному Plugin пам’яті змогу зареєструвати один
  або кілька ідентифікаторів адаптерів ембедингів (наприклад, `openai`, `gemini` або власний
  ідентифікатор, визначений Plugin).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, розв’язується відносно цих зареєстрованих
  ідентифікаторів адаптерів.

### Події та життєвий цикл

| Метод                                        | Що він робить                         |
| -------------------------------------------- | ------------------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу       |
| `api.onConversationBindingResolved(handler)` | Зворотний виклик прив’язки розмови    |

Див. [хуки Plugin](/uk/plugins/hooks) для прикладів, поширених назв хуків і семантики захисту.

### Семантика рішень хуків

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник бере dispatch на себе, обробники з нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` трактується як відсутність рішення (так само, як пропуск `cancel`), а не як перевизначення.
- `message_received`: використовуйте типізоване поле `threadId`, коли потрібна маршрутизація вхідної гілки/теми. Залишайте `metadata` для специфічних для каналу додаткових даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічного для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, яким володіє Gateway, замість покладання на внутрішні хуки `gateway:startup`.
- `cron_changed`: спостерігайте за змінами життєвого циклу Cron, яким володіє Gateway. Використовуйте `event.job?.state?.nextRunAtMs` і `ctx.getCron?.()` під час синхронізації зовнішніх планувальників пробудження, а OpenClaw залишайте джерелом істини для перевірок строків виконання та виконання.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор Plugin                                                                         |
| `api.name`               | `string`                  | Відображувана назва                                                                          |
| `api.version`            | `string?`                 | Версія Plugin (необов’язково)                                                                |
| `api.description`        | `string?`                 | Опис Plugin (необов’язково)                                                                  |
| `api.source`             | `string`                  | Шлях до джерела Plugin                                                                       |
| `api.rootDir`            | `string?`                 | Кореневий каталог Plugin (необов’язково)                                                     |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок середовища виконання в пам’яті, коли доступний) |
| `api.pluginConfig`       | `Record<string, unknown>` | Специфічна для Plugin конфігурація з `plugins.entries.<id>.config`                           |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби середовища виконання](/uk/plugins/sdk-runtime)                                |
| `api.logger`             | `PluginLogger`            | Обмежений логер (`debug`, `info`, `warn`, `error`)                                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це легке вікно запуску/налаштування перед повним входом |
| `api.resolvePath(input)` | `(string) => string`      | Розв’язати шлях відносно кореня Plugin                                                       |

## Конвенція внутрішніх модулів

У межах вашого Plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Ніколи не імпортуйте власний Plugin через `openclaw/plugin-sdk/<your-plugin>`
  з виробничого коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — лише зовнішній контракт.
</Warning>

Публічні поверхні вбудованих Plugin, завантажені через фасад (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` і подібні публічні вхідні файли), віддають перевагу
активному знімку конфігурації середовища виконання, коли OpenClaw уже запущено. Якщо знімка середовища
виконання ще немає, вони повертаються до розв’язаної конфігурації на диску.
Фасади упакованих вбудованих Plugin слід завантажувати через фасадні завантажувачі OpenClaw SDK;
прямі імпорти з `dist/extensions/...` оминають поетапні дзеркала залежностей середовища виконання,
які упаковані встановлення використовують для залежностей, якими володіє Plugin.

Plugin провайдерів можуть надавати вузький локальний для Plugin contract barrel, коли
допоміжний засіб навмисно специфічний для провайдера і ще не належить до загального підшляху SDK.
Вбудовані приклади:

- **Anthropic**: публічний шов `api.ts` / `contract-api.ts` для beta-header Claude
  і допоміжних засобів потоків `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує побудовники провайдера,
  допоміжні засоби типових моделей і побудовники realtime-провайдера.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує побудовник провайдера,
  а також допоміжні засоби onboarding/конфігурації.

<Warning>
  Виробничому коду розширення також слід уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді спільний, піднесіть його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або інша
  поверхня, орієнтована на можливість, замість того щоб зв’язувати два Plugins між собою.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Параметри `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/uk/plugins/sdk-runtime">
    Повна довідка простору імен `api.runtime`.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/uk/plugins/sdk-setup">
    Пакування, маніфести та схеми конфігурації.
  </Card>
  <Card title="Testing" icon="vial" href="/uk/plugins/sdk-testing">
    Утиліти тестування та правила lint.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/uk/plugins/sdk-migration">
    Міграція із застарілих поверхонь.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/uk/plugins/architecture">
    Глибока архітектура та модель можливостей.
  </Card>
</CardGroup>
