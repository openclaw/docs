---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібна довідка для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK overview
summary: Карта імпорту, довідка з API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-28T02:58:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: f4dbfde366d735863f5d22ce64d2ff812826989c2e4fd173173a26da62a3c786
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK — це типізований контракт між плагінами та ядром. Ця сторінка є
довідкою щодо **того, що імпортувати** і **що можна реєструвати**.

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

Кожен підшлях — це невеликий самодостатній модуль. Це забезпечує швидкий
запуск і запобігає проблемам із циклічними залежностями. Для специфічних для
каналу допоміжних засобів entry/build віддавайте перевагу
`openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` залишайте для
ширшої узагальненої поверхні та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

Для конфігурації каналу публікуйте JSON Schema, що належить каналу, через
`openclaw.plugin.json#channelConfigs`. Підшлях `plugin-sdk/channel-config-schema`
призначений для спільних примітивів схеми та загального конструктора. Вбудовані
плагіни OpenClaw використовують `plugin-sdk/bundled-channel-config-schema` для
збережених схем вбудованих каналів. Застарілі експорти сумісності залишаються в
`plugin-sdk/channel-config-schema-legacy`; жоден із підшляхів схем для
вбудованих компонентів не є шаблоном для нових плагінів.

<Warning>
  Не імпортуйте брендовані зручні шви провайдерів або каналів (наприклад,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані плагіни поєднують загальні підшляхи SDK у власних barrel-файлах
  `api.ts` / `runtime-api.ts`; споживачам ядра слід або використовувати ці
  локальні barrel-файли плагіна, або додати вузький загальний контракт SDK,
  коли потреба справді охоплює кілька каналів.

Невеликий набір допоміжних швів для вбудованих плагінів (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` та подібні) усе ще з’являється у
згенерованій карті експортів. Вони існують лише для супроводу вбудованих
плагінів і не рекомендуються як шляхи імпорту для нових сторонніх плагінів.
</Warning>

## Довідка за підшляхами

Plugin SDK доступний як набір вузьких підшляхів, згрупованих за напрямами
(вхід плагіна, канал, провайдер, автентифікація, runtime, можливості, пам’ять і
зарезервовані допоміжні засоби для вбудованих плагінів). Повний каталог —
з групуванням і посиланнями — див. у
[Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Зворотний виклик `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Метод                                           | Що він реєструє                        |
| ----------------------------------------------- | -------------------------------------- |
| `api.registerProvider(...)`                     | Виведення тексту (LLM)                 |
| `api.registerAgentHarness(...)`                 | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                   | Локальний backend виведення для CLI    |
| `api.registerChannel(...)`                      | Канал повідомлень                      |
| `api.registerSpeechProvider(...)`               | Синтез text-to-speech / STT            |
| `api.registerRealtimeTranscriptionProvider(...)`| Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`        | Дуплексні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`   | Аналіз зображень/аудіо/відео           |
| `api.registerImageGenerationProvider(...)`      | Генерація зображень                    |
| `api.registerMusicGenerationProvider(...)`      | Генерація музики                       |
| `api.registerVideoGenerationProvider(...)`      | Генерація відео                        |
| `api.registerWebFetchProvider(...)`             | Провайдер web fetch / scrape           |
| `api.registerWebSearchProvider(...)`            | Вебпошук                               |

### Інструменти та команди

| Метод                          | Що він реєструє                               |
| ------------------------------ | --------------------------------------------- |
| `api.registerTool(tool, opts?)`| Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`     | Користувацька команда (оминає LLM)            |

Команди плагіна можуть задавати `agentPromptGuidance`, коли агенту потрібна
коротка, керована командою підказка для маршрутизації. Зберігайте цей текст
сфокусованим на самій команді; не додавайте до конструкторів промптів ядра
політики, специфічні для провайдера або плагіна.

### Інфраструктура

| Метод                                         | Що він реєструє                        |
| --------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`    | Хук подій                              |
| `api.registerHttpRoute(params)`               | HTTP-ендпойнт Gateway                  |
| `api.registerGatewayMethod(name, handler)`    | RPC-метод Gateway                      |
| `api.registerGatewayDiscoveryService(service)`| Сервіс оголошення локального виявлення Gateway |
| `api.registerCli(registrar, opts?)`           | Підкоманда CLI                         |
| `api.registerService(service)`                | Фоновий сервіс                         |
| `api.registerInteractiveHandler(registration)`| Інтерактивний обробник                 |
| `api.registerAgentToolResultMiddleware(...)`  | Middleware результатів інструментів runtime |
| `api.registerMemoryPromptSupplement(builder)` | Додатковий розділ промпта, суміжний із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)` | Додатковий корпус пошуку/читання пам’яті |

### Хуки хоста для workflow-плагінів

Хуки хоста — це шви SDK для плагінів, яким потрібно брати участь у життєвому
циклі хоста, а не лише додавати провайдера, канал або інструмент. Це загальні
контракти; їх може використовувати Plan Mode, але також і workflow затвердження,
шлюзи політик робочого простору, фонові монітори, майстри налаштування та
додаткові UI-плагіни.

| Метод                                                                   | Контракт, за який він відповідає                                                      |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Стан сесії, що належить плагіну, сумісний з JSON і проєктується через сесії Gateway   |
| `api.enqueueNextTurnInjection(...)`                                      | Надійний контекст exactly-once, ін’єктований у наступний хід агента для однієї сесії  |
| `api.registerTrustedToolPolicy(...)`                                     | Політика інструментів bundled/trusted до плагіна, яка може блокувати або переписувати параметри інструментів |
| `api.registerToolMetadata(...)`                                          | Метадані відображення каталогу інструментів без зміни реалізації інструмента           |
| `api.registerCommand(...)`                                               | Обмежені плагіном команди; результати команд можуть задавати `continueAgent: true`     |
| `api.registerControlUiDescriptor(...)`                                   | Дескриптори внеску в Control UI для поверхонь сесії, інструмента, запуску або налаштувань |
| `api.registerRuntimeLifecycle(...)`                                      | Зворотні виклики очищення для runtime-ресурсів, що належать плагіну, на шляхах reset/delete/reload |
| `api.registerAgentEventSubscription(...)`                                | Санітизовані підписки на події для стану workflow і моніторів                          |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Тимчасовий стан плагіна на рівні запуску, що очищається в термінальному життєвому циклі запуску |
| `api.registerSessionSchedulerJob(...)`                                   | Записи завдань планувальника сесій, що належать плагіну, з детермінованим очищенням    |

Контракти навмисно розділяють повноваження:

- Зовнішні плагіни можуть володіти розширеннями сесій, дескрипторами UI, командами, метаданими інструментів, ін’єкціями наступного ходу та звичайними хуками.
- Trusted tool policies виконуються перед звичайними хуками `before_tool_call` і доступні лише для bundled, оскільки вони беруть участь у політиці безпеки хоста.
- Володіння зарезервованими командами доступне лише bundled. Зовнішнім плагінам слід використовувати власні імена команд або псевдоніми.
- `allowPromptInjection=false` вимикає хуки, що змінюють промпт, включно з
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  полями промпта зі застарілого `before_agent_start`, а також
  `enqueueNextTurnInjection`.

Приклади споживачів поза Plan:

| Архетип плагіна              | Використовувані хуки                                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow затвердження        | Розширення сесії, продовження команди, ін’єкція наступного ходу, дескриптор UI                                                        |
| Шлюз політики бюджету/робочого простору | Trusted tool policy, метадані інструментів, проєкція сесії                                                               |
| Фоновий монітор життєвого циклу | Очищення життєвого циклу runtime, підписка на події агента, володіння/очищення планувальника сесії, внесок у Heartbeat-промпт, дескриптор UI |
| Майстер налаштування або онбордингу | Розширення сесії, обмежені команди, дескриптор Control UI                                                                      |

<Note>
  Зарезервовані простори імен адміністратора ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо плагін намагається
  призначити вужчу область видимості для методу Gateway. Для методів, що
  належать плагіну, віддавайте перевагу префіксам, специфічним для плагіна.
</Note>

<Accordion title="Коли використовувати middleware результатів інструментів">
  Вбудовані плагіни можуть використовувати `api.registerAgentToolResultMiddleware(...)`,
  коли їм потрібно переписати результат інструмента після виконання і до того,
  як runtime передасть цей результат назад у модель. Це trusted
  runtime-нейтральний шов для асинхронних редукторів виводу, таких як tokenjuice.

Вбудовані плагіни повинні оголошувати `contracts.agentToolResultMiddleware` для
кожного цільового runtime, наприклад `["pi", "codex"]`. Зовнішні плагіни
не можуть реєструвати це middleware; для робіт, яким не потрібен момент
обробки результату інструмента до моделі, використовуйте звичайні хуки плагінів OpenClaw. Старий шлях реєстрації вбудованої фабрики розширень лише для Pi було видалено.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дозволяє плагіну оголошувати активний
Gateway у локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw
викликає сервіс під час запуску Gateway, коли локальне виявлення ввімкнено,
передає поточні порти Gateway і несекретні TXT-підказки, а під час вимкнення
Gateway викликає повернутий обробник `stop`.

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

Плагіни виявлення Gateway не повинні розглядати оголошені значення TXT як
секрети або автентифікацію. Виявлення — це підказка для маршрутизації; довірою
й надалі керують автентифікація Gateway і TLS pinning.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, що належать registrar
- `descriptors`: дескриптори команд на етапі парсингу, які використовуються для довідки кореневого CLI,
  маршрутизації та відкладеної реєстрації CLI плагіна

Якщо ви хочете, щоб команда плагіна залишалася відкладено завантажуваною у
звичайному шляху кореневого CLI, надайте `descriptors`, які охоплюють кожен
корінь команди верхнього рівня, що експонується цим registrar.

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

Використовуйте лише `commands`, тільки якщо вам не потрібна відкладена
реєстрація кореневого CLI. Цей eager-шлях сумісності все ще підтримується, але
він не встановлює заповнювачі на основі descriptors для відкладеного
завантаження під час парсингу.

### Реєстрація CLI backend

`api.registerCliBackend(...)` дозволяє плагіну володіти конфігурацією за
замовчуванням для локального AI CLI backend, такого як `codex-cli`.

- `id` backend стає префіксом провайдера в посиланнях на моделі, таких як `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх конфігурації плагіна за замовчуванням перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписування для сумісності після об’єднання (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Метод                                     | Що він реєструє                                                                                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`  | Рушій контексту (одночасно активний лише один). Зворотний виклик `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг адаптувати доповнення до промпта. |
| `api.registerMemoryCapability(capability)`| Уніфікована можливість пам’яті                                                                                                                               |
| `api.registerMemoryPromptSection(builder)`| Конструктор розділу промпта пам’яті                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`   | Резолвер плану скидання пам’яті                                                                                                                              |
| `api.registerMemoryRuntime(runtime)`      | Адаптер runtime пам’яті                                                                                                                                      |

### Адаптери embedding пам’яті

| Метод                                         | Що він реєструє                                 |
| --------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)`| Адаптер embedding пам’яті для активного плагіна |

- `registerMemoryCapability` — це бажаний API ексклюзивного плагіна пам’яті.
- `registerMemoryCapability` також може експонувати `publicArtifacts.listArtifacts(...)`,
  щоб супутні плагіни могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core` замість звернення до приватної
  структури конкретного плагіна пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це застаріло-сумісні API ексклюзивного плагіна пам’яті.
- `registerMemoryEmbeddingProvider` дозволяє активному плагіну пам’яті
  реєструвати один або кілька id адаптерів embedding (наприклад `openai`,
  `gemini` або користувацький id, визначений плагіном).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, зіставляється з цими
  зареєстрованими id адаптерів.

### Події та життєвий цикл

| Метод                                       | Що він робить                 |
| ------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`          | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)`| Зворотний виклик прив’язки розмови |

Див. [Хуки плагінів](/uk/plugins/hooks) для прикладів, поширених назв хуків і
семантики guard.

### Семантика рішень хуків

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник бере на себе dispatch, обробники з нижчим пріоритетом і стандартний шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як і пропуск `cancel`), а не перевизначенням.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна маршрутизація вхідного thread/topic. `metadata` залишайте для доповнень, специфічних для каналу.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічного для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить Gateway, замість покладання на внутрішні хуки `gateway:startup`.

### Поля об’єкта API

| Поле                    | Тип                       | Опис                                                                                              |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| `api.id`                | `string`                  | Id плагіна                                                                                        |
| `api.name`              | `string`                  | Відображувана назва                                                                               |
| `api.version`           | `string?`                 | Версія плагіна (необов’язково)                                                                    |
| `api.description`       | `string?`                 | Опис плагіна (необов’язково)                                                                      |
| `api.source`            | `string`                  | Шлях до джерела плагіна                                                                           |
| `api.rootDir`           | `string?`                 | Кореневий каталог плагіна (необов’язково)                                                         |
| `api.config`            | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок runtime у пам’яті, якщо доступний)                 |
| `api.pluginConfig`      | `Record<string, unknown>` | Конфігурація, специфічна для плагіна, з `plugins.entries.<id>.config`                            |
| `api.runtime`           | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                                  |
| `api.logger`            | `PluginLogger`            | Логер в межах області (`debug`, `info`, `warn`, `error`)                                          |
| `api.registrationMode`  | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного входу |
| `api.resolvePath(input)`| `(string) => string`      | Розв’язати шлях відносно кореня плагіна                                                           |

## Угода щодо внутрішніх модулів

У межах вашого плагіна використовуйте локальні barrel-файли для внутрішніх
імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Експорти runtime лише для внутрішнього використання
  index.ts          # Точка входу плагіна
  setup-entry.ts    # Полегшений вхід лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний плагін через `openclaw/plugin-sdk/<your-plugin>`
  з production-коду. Направляйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Публічні поверхні вбудованих плагінів, завантажувані через facade (`api.ts`,
`runtime-api.ts`, `index.ts`, `setup-entry.ts` та подібні публічні файли входу),
віддають перевагу активному знімку конфігурації runtime, якщо OpenClaw уже
запущено. Якщо знімок runtime ще не існує, вони повертаються до розв’язаного
файлу конфігурації на диску. Упаковані facade вбудованих плагінів слід
завантажувати через завантажувачі facade SDK OpenClaw; прямі імпорти з
`dist/extensions/...` обходять staged-модулі runtime dependency mirror, які
упаковані встановлення використовують для залежностей, що належать плагіну.

Плагіни провайдерів можуть експонувати вузький локальний contract barrel
плагіна, коли певний допоміжний засіб навмисно є специфічним для провайдера і
ще не належить до загального підшляху SDK. Приклади вбудованих плагінів:

- **Anthropic**: публічний шов `api.ts` / `contract-api.ts` для допоміжних засобів потоку Claude beta-header і `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує конструктори провайдерів,
  допоміжні засоби моделей за замовчуванням і конструктори провайдерів realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує конструктор
  провайдера, а також допоміжні засоби онбордингу/конфігурації.

<Warning>
  Production-код розширень також не повинен використовувати імпорти
  `openclaw/plugin-sdk/<other-plugin>`. Якщо допоміжний засіб справді є
  спільним, перенесіть його до нейтрального підшляху SDK, такого як
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливості, замість зв’язування двох плагінів.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Параметри `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Допоміжні засоби runtime" icon="gears" href="/uk/plugins/sdk-runtime">
    Повна довідка простору імен `api.runtime`.
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
