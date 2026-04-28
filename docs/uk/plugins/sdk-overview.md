---
read_when:
    - Потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник усіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK overview
summary: Карта імпорту, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-28T20:12:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83f554cf3653cdae5027eac2048280a9200828c5ed256d975cd745a77ba1e796
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK плагінів — це типізований контракт між плагінами та ядром. Ця сторінка є
довідником щодо **того, що імпортувати** і **що можна реєструвати**.

<Tip>
Шукаєте натомість практичний посібник? Почніть із [Створення плагінів](/uk/plugins/building-plugins), використовуйте [Плагіни каналів](/uk/plugins/sdk-channel-plugins) для плагінів каналів, [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) для плагінів провайдерів і [Хуки Plugin](/uk/plugins/hooks) для плагінів інструментів або хуків життєвого циклу.
</Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це забезпечує швидкий запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналу помічників входу/збирання
віддавайте перевагу `openclaw/plugin-sdk/channel-core`; залишайте `openclaw/plugin-sdk/core` для
ширшої поверхні-парасольки та спільних помічників, таких як
`buildChannelConfigSchema`.

Для конфігурації каналу публікуйте JSON Schema, якою володіє канал, через
`openclaw.plugin.json#channelConfigs`. Підшлях `plugin-sdk/channel-config-schema`
призначений для спільних примітивів схеми та універсального конструктора. Вбудовані
плагіни OpenClaw використовують `plugin-sdk/bundled-channel-config-schema` для збережених
схем вбудованих каналів. Застарілі експорти сумісності залишаються в
`plugin-sdk/channel-config-schema-legacy`; жоден підшлях вбудованих схем не є
зразком для нових плагінів.

<Warning>
  Не імпортуйте зручні шви з брендуванням провайдера або каналу (наприклад
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані плагіни компонують універсальні підшляхи SDK у власних барелях `api.ts` /
  `runtime-api.ts`; споживачам ядра слід або використовувати ці локальні для плагіна
  барелі, або додати вузький універсальний контракт SDK, коли потреба справді
  є міжканальною.

Невеликий набір допоміжних швів вбудованих плагінів досі з’являється у згенерованій карті експортів,
коли для них відстежується використання власником. Вони існують лише для супроводу
вбудованих плагінів і не рекомендовані як шляхи імпорту для нових сторонніх
плагінів.

`openclaw/plugin-sdk/discord` також збережено як застарілий фасад сумісності
для опублікованого пакета `@openclaw/discord@2026.3.13`. Не копіюйте цей шлях імпорту
в нові плагіни; натомість використовуйте універсальні підшляхи SDK каналів.
</Warning>

## Довідник підшляхів

SDK плагінів надається як набір вузьких підшляхів, згрупованих за областями (вхід
плагіна, канал, провайдер, автентифікація, runtime, можливості, пам’ять і зарезервовані
помічники вбудованих плагінів). Повний каталог — згрупований і з посиланнями — див.
у [Підшляхи SDK Plugin](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Зворотний виклик `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Метод                                            | Що він реєструє                       |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Текстове виведення (LLM)              |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний бекенд виведення CLI        |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями           |
| `api.registerSpeechProvider(...)`                | Text-to-speech / STT синтез           |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео          |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                   |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                      |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                       |
| `api.registerWebFetchProvider(...)`              | Провайдер веботримання / скрейпінгу   |
| `api.registerWebSearchProvider(...)`             | Вебпошук                              |

### Інструменти та команди

| Метод                         | Що він реєструє                              |
| ----------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`     | Користувацька команда (оминає LLM)           |

Команди плагіна можуть задавати `agentPromptGuidance`, коли агенту потрібна коротка
підказка маршрутизації, якою володіє команда. Тримайте цей текст про саму команду; не додавайте
політику, специфічну для провайдера або плагіна, до побудовників промптів ядра.

### Інфраструктура

| Метод                                          | Що він реєструє                        |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Хук події                              |
| `api.registerHttpRoute(params)`                | HTTP endpoint Gateway                  |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Локальний рекламодавець виявлення Gateway |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                         |
| `api.registerService(service)`                 | Фонова служба                          |
| `api.registerInteractiveHandler(registration)` | Інтерактивний обробник                 |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime middleware результатів інструментів |
| `api.registerMemoryPromptSupplement(builder)`  | Додатковий розділ промпта, суміжний із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`  | Додатковий корпус пошуку/читання пам’яті |

### Хост-хуки для плагінів робочих процесів

Хост-хуки — це шви SDK для плагінів, яким потрібно брати участь у життєвому циклі хоста,
а не лише додавати провайдера, канал або інструмент. Це
універсальні контракти; їх може використовувати Plan Mode, але також можуть процеси схвалення,
шлюзи політик робочої області, фонові монітори, майстри налаштування та супровідні UI-плагіни.

| Метод                                                                    | Контракт, яким він володіє                                                         |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Стан сесії, яким володіє плагін і який сумісний із JSON, проєктований через сесії Gateway |
| `api.enqueueNextTurnInjection(...)`                                      | Стійкий контекст рівно один раз, інжектований у наступний хід агента для однієї сесії |
| `api.registerTrustedToolPolicy(...)`                                     | Політика інструментів довіреного передплагінного етапу, яка може блокувати або переписувати параметри інструментів |
| `api.registerToolMetadata(...)`                                          | Метадані відображення каталогу інструментів без зміни реалізації інструмента       |
| `api.registerCommand(...)`                                               | Обмежені за областю команди плагіна; результати команд можуть задавати `continueAgent: true` |
| `api.registerControlUiDescriptor(...)`                                   | Дескриптори внеску Control UI для поверхонь сесії, інструмента, запуску або налаштувань |
| `api.registerRuntimeLifecycle(...)`                                      | Зворотні виклики очищення для runtime-ресурсів, якими володіє плагін, на шляхах reset/delete/reload |
| `api.registerAgentEventSubscription(...)`                                | Очищені підписки на події для стану робочого процесу та моніторів                  |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Чернетковий стан плагіна для окремого запуску, очищений під час завершального життєвого циклу запуску |
| `api.registerSessionSchedulerJob(...)`                                   | Записи завдань планувальника сесій, якими володіє плагін, із детермінованим очищенням |

Контракти навмисно розділяють повноваження:

- Зовнішні плагіни можуть володіти розширеннями сесій, UI-дескрипторами, командами, метаданими інструментів, інжекціями в наступний хід і звичайними хуками.
- Довірені політики інструментів виконуються перед звичайними хуками `before_tool_call` і доступні лише вбудованим плагінам, бо вони беруть участь у політиці безпеки хоста.
- Зарезервоване володіння командами доступне лише вбудованим плагінам. Зовнішні плагіни мають використовувати власні імена команд або псевдоніми.
- `allowPromptInjection=false` вимикає хуки, що змінюють промпт, зокрема
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  поля промпта зі спадкового `before_agent_start` та
  `enqueueNextTurnInjection`.

Приклади споживачів не з Plan:

| Архетип плагіна             | Використані хуки                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Процес схвалення            | Розширення сесії, продовження команди, інжекція в наступний хід, UI-дескриптор                                                       |
| Шлюз політик бюджету/робочої області | Довірена політика інструментів, метадані інструментів, проєкція сесії                                                         |
| Фоновий монітор життєвого циклу | Очищення життєвого циклу runtime, підписка на події агента, володіння/очищення планувальника сесій, внесок промпта Heartbeat, UI-дескриптор |
| Майстер налаштування або onboarding | Розширення сесії, команди з областю дії, дескриптор Control UI                                                                 |

<Note>
  Зарезервовані адміністративні простори імен ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо плагін намагається призначити
  вужчу область методу gateway. Віддавайте перевагу специфічним для плагіна префіксам для
  методів, якими володіє плагін.
</Note>

<Accordion title="Коли використовувати middleware результатів інструментів">
  Вбудовані плагіни можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
  їм потрібно переписати результат інструмента після виконання і до того, як runtime
  передасть цей результат назад у модель. Це довірений нейтральний до runtime
  шов для асинхронних редукторів виводу, таких як tokenjuice.

Вбудовані плагіни мають оголошувати `contracts.agentToolResultMiddleware` для кожного
цільового runtime, наприклад `["pi", "codex"]`. Зовнішні плагіни
не можуть реєструвати це middleware; залишайте звичайні хуки плагінів OpenClaw для роботи,
яка не потребує таймінгу результату інструмента перед моделлю. Старий вбудований
шлях реєстрації фабрики розширення лише для Pi було видалено.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дає плагіну змогу рекламувати активний
Gateway у локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw викликає
службу під час запуску Gateway, коли локальне виявлення ввімкнено, передає
поточні порти Gateway і несекретні TXT-підказки, а також викликає повернений
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

Плагіни виявлення Gateway не повинні трактувати рекламовані значення TXT як секрети або
автентифікацію. Виявлення — це підказка маршрутизації; довірою все ще керують автентифікація Gateway і TLS-пінінг.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє реєстратор
- `descriptors`: дескриптори команд часу розбору, які використовуються для довідки кореневого CLI,
  маршрутизації та лінивої реєстрації CLI Plugin

Якщо ви хочете, щоб команда Plugin залишалася ліниво завантажуваною у звичайному шляху кореневого CLI,
надайте `descriptors`, які охоплюють кожен корінь команди верхнього рівня, що надається цим
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

Використовуйте `commands` самостійно лише тоді, коли вам не потрібна лінива реєстрація кореневого CLI.
Цей енергійний шлях сумісності залишається підтримуваним, але він не встановлює
заповнювачі на основі дескрипторів для лінивого завантаження під час розбору.

### Реєстрація бекенда CLI

`api.registerCliBackend(...)` дає Plugin змогу володіти типовою конфігурацією для локального
AI CLI бекенда, такого як `codex-cli`.

- Backend `id` стає префіксом постачальника в посиланнях на модель, як-от `codex-cli/gpt-5`.
- Backend `config` використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw об'єднує `agents.defaults.cliBackends.<id>` поверх
  типового значення Plugin перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписувань сумісності після об'єднання
  (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Метод                                      | Що він реєструє                                                                                                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Рушій контексту (одночасно активний лише один). Callback `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг адаптувати доповнення до prompt. |
| `api.registerMemoryCapability(capability)` | Уніфікована можливість пам'яті                                                                                                                                    |
| `api.registerMemoryPromptSection(builder)` | Побудовник секції prompt пам'яті                                                                                                                                  |
| `api.registerMemoryFlushPlan(resolver)`    | Резолвер плану очищення пам'яті                                                                                                                                   |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime пам'яті                                                                                                                                           |

### Адаптери embedding пам'яті

| Метод                                          | Що він реєструє                                  |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding пам'яті для активного Plugin |

- `registerMemoryCapability` є рекомендованим ексклюзивним API Plugin пам'яті.
- `registerMemoryCapability` також може надавати `publicArtifacts.listArtifacts(...)`,
  щоб супутні plugins могли споживати експортовані артефакти пам'яті через
  `openclaw/plugin-sdk/memory-host-core`, а не звертатися до приватної структури конкретного
  Plugin пам'яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` є застаріло-сумісними ексклюзивними API Plugin пам'яті.
- `MemoryFlushPlan.model` може прив'язати turn очищення до точного посилання `provider/model`,
  наприклад `ollama/qwen3:8b`, без успадкування активного ланцюжка fallback.
- `registerMemoryEmbeddingProvider` дає активному Plugin пам'яті змогу зареєструвати один
  або більше id адаптерів embedding (наприклад `openai`, `gemini` або власний
  id, визначений Plugin).
- Конфігурація користувача, як-от `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, розв'язується відносно цих зареєстрованих
  id адаптерів.

### Події та життєвий цикл

| Метод                                        | Що він робить                    |
| -------------------------------------------- | -------------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу  |
| `api.onConversationBindingResolved(handler)` | Callback прив'язки розмови       |

Див. [Хуки Plugin](/uk/plugins/hooks) для прикладів, поширених назв хуків і семантики guard.

### Семантика рішень хуків

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює його, handlers із нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює його, handlers із нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який handler бере dispatch на себе, handlers із нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який handler встановлює його, handlers із нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` трактується як відсутність рішення (так само, як пропуск `cancel`), а не як перевизначення.
- `message_received`: використовуйте типізоване поле `threadId`, коли потрібна маршрутизація вхідного thread/topic. Залишайте `metadata` для специфічних для каналу додаткових даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічних для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, яким володіє gateway, замість покладання на внутрішні хуки `gateway:startup`.
- `cron_changed`: спостерігайте за змінами життєвого циклу Cron, яким володіє gateway. Використовуйте `event.job?.state?.nextRunAtMs` і `ctx.getCron?.()` під час синхронізації зовнішніх планувальників пробудження, і зберігайте OpenClaw джерелом істини для перевірок строків і виконання.

### Поля об'єкта API

| Поле                     | Тип                       | Опис                                                                                                  |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id Plugin                                                                                             |
| `api.name`               | `string`                  | Відображувана назва                                                                                   |
| `api.version`            | `string?`                 | Версія Plugin (необов'язково)                                                                         |
| `api.description`        | `string?`                 | Опис Plugin (необов'язково)                                                                           |
| `api.source`             | `string`                  | Шлях до джерела Plugin                                                                                |
| `api.rootDir`            | `string?`                 | Коренева директорія Plugin (необов'язково)                                                            |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний runtime-знімок у пам'яті, коли доступний)                      |
| `api.pluginConfig`       | `Record<string, unknown>` | Специфічна для Plugin конфігурація з `plugins.entries.<id>.config`                                    |
| `api.runtime`            | `PluginRuntime`           | [Runtime-помічники](/uk/plugins/sdk-runtime)                                                             |
| `api.logger`             | `PluginLogger`            | Обмежений logger (`debug`, `info`, `warn`, `error`)                                                   |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — легке вікно startup/setup перед повним entry         |
| `api.resolvePath(input)` | `(string) => string`      | Розв'язати шлях відносно кореня Plugin                                                                |

## Угода щодо внутрішніх модулів

Усередині вашого Plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

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

Публічні поверхні bundled Plugin, завантажені через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` і подібні публічні entry-файли), віддають перевагу
активному runtime-знімку конфігурації, коли OpenClaw уже працює. Якщо runtime-знімка
ще немає, вони повертаються до розв'язаної конфігурації з файлу на диску.
Упаковані bundled facade Plugin слід завантажувати через facade loaders OpenClaw SDK;
прямі імпорти з `dist/extensions/...` обходять staged runtime mirrors залежностей,
які packaged installs використовують для залежностей, що належать Plugin.

Provider plugins можуть надавати вузький локальний barrel контракту Plugin, коли
helper навмисно специфічний для provider і ще не належить до generic SDK
subpath. Bundled приклади:

- **Anthropic**: публічний seam `api.ts` / `contract-api.ts` для Claude
  beta-header і stream helpers `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує provider builders,
  helpers типової моделі та realtime provider builders.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує provider builder
  плюс helpers onboarding/config.

<Warning>
  Production-код extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо helper справді спільний, підніміть його до нейтрального SDK subpath,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або інша
  поверхня, орієнтована на можливості, замість того щоб зв'язувати два plugins між собою.
</Warning>

## Пов'язане

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Параметри `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime-помічники" icon="gears" href="/uk/plugins/sdk-runtime">
    Повна довідка простору імен `api.runtime`.
  </Card>
  <Card title="Setup і конфігурація" icon="sliders" href="/uk/plugins/sdk-setup">
    Пакування, manifests і config schemas.
  </Card>
  <Card title="Тестування" icon="vial" href="/uk/plugins/sdk-testing">
    Тестові утиліти та правила lint.
  </Card>
  <Card title="Міграція SDK" icon="arrows-turn-right" href="/uk/plugins/sdk-migration">
    Міграція із застарілих поверхонь.
  </Card>
  <Card title="Внутрішня архітектура Plugin" icon="diagram-project" href="/uk/plugins/architecture">
    Поглиблена архітектура та модель можливостей.
  </Card>
</CardGroup>
