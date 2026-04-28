---
read_when:
    - Потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK overview
summary: Карта імпорту, довідник з API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-28T00:10:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9b00b189c2a5e632a1c7e614a3e9371dcc3114d3582d795e3c88fb5d5a0f13a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK — це типізований контракт між плагінами та ядром. Ця сторінка —
довідник про **що імпортувати** і **що можна реєструвати**.

<Tip>
  Шукаєте натомість практичний посібник?

- Перший плагін? Почніть із [Створення плагінів](/uk/plugins/building-plugins).
- Плагін каналу? Див. [Плагіни каналів](/uk/plugins/sdk-channel-plugins).
- Плагін провайдера? Див. [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins).
- Плагін інструмента або хука життєвого циклу? Див. [Хуки плагінів](/uk/plugins/hooks).
  </Tip>

## Правило імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це пришвидшує запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналу
допоміжних засобів entry/build віддавайте перевагу
`openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` залишайте для
ширшої узагальненої поверхні та спільних допоміжних функцій, таких як
`buildChannelConfigSchema`.

Для конфігурації каналу публікуйте JSON Schema, що належить каналу, через
`openclaw.plugin.json#channelConfigs`. Підшлях `plugin-sdk/channel-config-schema`
призначений для спільних примітивів схем і універсального збирача. Застарілі
експорти схем вбудованих каналів розміщено в
`plugin-sdk/channel-config-schema-legacy` лише для сумісності з вбудованими
рішеннями; це не шаблон для нових плагінів.

<Warning>
  Не імпортуйте зручні seam-інтерфейси, позначені як provider або channel (наприклад
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані плагіни поєднують універсальні підшляхи SDK усередині власних barrel-файлів
  `api.ts` / `runtime-api.ts`; споживачам ядра слід або використовувати ці локальні
  barrel-файли плагіна, або додати вузький універсальний контракт SDK, якщо потреба
  справді є міжканальною.

Невеликий набір допоміжних seam-інтерфейсів для вбудованих плагінів (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` та подібні) усе ще присутній у
згенерованій карті експортів. Вони існують лише для супроводу вбудованих плагінів і
не рекомендуються як шляхи імпорту для нових сторонніх плагінів.
</Warning>

## Довідник підшляхів

Plugin SDK надається як набір вузьких підшляхів, згрупованих за напрямами (entry
плагіна, channel, provider, auth, runtime, capability, memory і зарезервовані
допоміжні засоби для вбудованих плагінів). Повний каталог — згрупований і з
посиланнями — див. у [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Метод                                            | Що він реєструє                       |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Текстову інференцію (LLM)             |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний backend інференції CLI      |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями           |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокову транскрипцію в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Двобічні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео          |
| `api.registerImageGenerationProvider(...)`       | Генерацію зображень                   |
| `api.registerMusicGenerationProvider(...)`       | Генерацію музики                      |
| `api.registerVideoGenerationProvider(...)`       | Генерацію відео                       |
| `api.registerWebFetchProvider(...)`              | Провайдер web fetch / scrape          |
| `api.registerWebSearchProvider(...)`             | Вебпошук                              |

### Інструменти та команди

| Метод                           | Що він реєструє                              |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацьку команду (обходить LLM)         |

Команди плагіна можуть задавати `agentPromptGuidance`, коли агенту потрібна
коротка підказка маршрутизації, що належить команді. Робіть цей текст саме про
команду; не додавайте специфічну для провайдера чи плагіна політику до
збирачів prompt у ядрі.

### Інфраструктура

| Метод                                          | Що він реєструє                        |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Хук події                              |
| `api.registerHttpRoute(params)`                | HTTP-ендпойнт Gateway                  |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Сервіс оголошення локального виявлення Gateway |
| `api.registerCli(registrar, opts?)`            | Підкоманду CLI                         |
| `api.registerService(service)`                 | Фоновий сервіс                         |
| `api.registerInteractiveHandler(registration)` | Інтерактивний обробник                 |
| `api.registerAgentToolResultMiddleware(...)`   | Проміжний обробник результатів інструментів runtime |
| `api.registerMemoryPromptSupplement(builder)`  | Адитивний розділ prompt, суміжний із memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Адитивний корпус для пошуку/читання memory |

### Хуки хоста для workflow-плагінів

Хуки хоста — це seam-інтерфейси SDK для плагінів, яким потрібно брати участь у
життєвому циклі хоста, а не лише додавати provider, channel або tool. Це
універсальні контракти; їх може використовувати Plan Mode, але так само ними
можуть користуватися workflow затвердження, шлюзи політик робочого простору,
фонові монітори, майстри налаштування та UI-плагіни-компаньйони.

| Метод                                                                    | Контракт, яким він володіє                                                         |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Стан сесії, що належить плагіну, сумісний із JSON і проєктується через сесії Gateway |
| `api.enqueueNextTurnInjection(...)`                                      | Надійний контекст рівно-один-раз, що вбудовується в наступний хід агента для однієї сесії |
| `api.registerTrustedToolPolicy(...)`                                     | Політика інструментів trusted/bundled до плагіна, яка може блокувати або переписувати параметри інструментів |
| `api.registerToolMetadata(...)`                                          | Метадані відображення каталогу інструментів без зміни реалізації інструмента       |
| `api.registerCommand(...)`                                               | Обмежені команди плагіна; результати команд можуть встановлювати `continueAgent: true` |
| `api.registerControlUiDescriptor(...)`                                   | Дескриптори внеску в Control UI для поверхонь сесій, інструментів, запусків або налаштувань |
| `api.registerRuntimeLifecycle(...)`                                      | Колбеки очищення для ресурсів runtime, що належать плагіну, на шляхах reset/delete/reload |
| `api.registerAgentEventSubscription(...)`                                | Санітизовані підписки на події для стану workflow і моніторів                      |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Чернетковий стан плагіна на рівні запуску, що очищується на завершальному етапі життєвого циклу запуску |
| `api.registerSessionSchedulerJob(...)`                                   | Записи завдань планувальника сесій, що належать плагіну, з детермінованим очищенням |

Ці контракти навмисно розділяють повноваження:

- Зовнішні плагіни можуть володіти розширеннями сесій, дескрипторами UI, командами,
  метаданими інструментів, ін’єкціями в наступний хід і звичайними хуками.
- Політики trusted інструментів виконуються до звичайних хуків `before_tool_call` і
  доступні лише для bundled, оскільки вони беруть участь у політиці безпеки хоста.
- Володіння зарезервованими командами доступне лише для bundled. Зовнішнім плагінам
  слід використовувати власні назви команд або псевдоніми.
- `allowPromptInjection=false` вимикає хуки, що змінюють prompt, включно з
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  полями prompt із застарілого `before_agent_start` і
  `enqueueNextTurnInjection`.

Приклади споживачів, не пов’язаних із Plan:

| Архетип плагіна               | Використовувані хуки                                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow затвердження         | Розширення сесії, продовження команди, ін’єкція в наступний хід, дескриптор UI                                                        |
| Шлюз політик бюджету/робочого простору | Trusted tool policy, metadata інструментів, проєкція сесії                                                                   |
| Фоновий монітор життєвого циклу | Очищення життєвого циклу runtime, підписка на події агента, володіння/очищення планувальника сесій, внесок у Heartbeat prompt, дескриптор UI |
| Майстер налаштування або онбордингу | Розширення сесії, обмежені команди, дескриптор Control UI                                                                      |

<Note>
  Зарезервовані простори назв адміністратора ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо плагін намагається призначити
  вужчу область видимості методу gateway. Для методів, що належать плагіну,
  віддавайте перевагу префіксам, специфічним для плагіна.
</Note>

<Accordion title="Коли використовувати проміжний обробник результатів інструментів">
  Вбудовані плагіни можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
  їм потрібно переписати результат інструмента після виконання і до того, як runtime
  поверне цей результат назад у модель. Це trusted і runtime-нейтральний
  seam-інтерфейс для асинхронних редукторів виводу, таких як tokenjuice.

Вбудовані плагіни повинні оголошувати `contracts.agentToolResultMiddleware` для
кожного цільового runtime, наприклад `["pi", "codex"]`. Зовнішні плагіни
не можуть реєструвати цей middleware; для роботи, якій не потрібен таймінг
результатів інструментів до моделі, використовуйте звичайні хуки плагінів OpenClaw. Старий
шлях реєстрації фабрики вбудованих розширень лише для Pi було вилучено.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дозволяє плагіну оголошувати активний
Gateway у локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw викликає
сервіс під час запуску Gateway, коли ввімкнено локальне виявлення, передає
поточні порти Gateway і не секретні підказки даних TXT, а також викликає
повернений обробник `stop` під час зупинки Gateway.

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

Плагіни виявлення Gateway не повинні трактувати оголошені значення TXT як
секрети або автентифікацію. Виявлення — це підказка маршрутизації; довірою, як і
раніше, керують автентифікація Gateway та TLS pinning.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє реєстратор
- `descriptors`: дескриптори команд на етапі парсингу, які використовуються для довідки кореневого CLI,
  маршрутизації та лінивої реєстрації CLI плагіна

Якщо ви хочете, щоб команда плагіна залишалася ліниво завантажуваною в
звичайному кореневому шляху CLI, надайте `descriptors`, які охоплюють кожен
корінь команди верхнього рівня, що експонується цим реєстратором.

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

Використовуйте лише `commands`, якщо вам не потрібна лінива реєстрація
кореневого CLI. Цей сумісний eager-шлях усе ще підтримується, але він не
встановлює заповнювачі на основі descriptors для лінивого завантаження на етапі
парсингу.

### Реєстрація backend CLI

`api.registerCliBackend(...)` дозволяє плагіну володіти конфігурацією за
замовчуванням для локального backend CLI ШІ, такого як `codex-cli`.

- `id` backend стає префіксом провайдера в посиланнях на моделі, як-от `codex-cli/gpt-5`.
- `config` backend використовує ту саму структуру, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  значення за замовчуванням плагіна перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписувань для сумісності після злиття
  (наприклад, для нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Метод                                      | Що він реєструє                                                                                                                                           |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (одночасно активним може бути лише один). Колбек `assemble()` отримує `availableTools` і `citationsMode`, щоб engine міг адаптувати доповнення prompt. |
| `api.registerMemoryCapability(capability)` | Уніфіковану можливість memory                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | Builder розділу prompt для memory                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану flush для memory                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime для memory                                                                                                                                |

### Адаптери embedding для memory

| Метод                                          | Що він реєструє                                 |
| ---------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding для memory для активного плагіна |

- `registerMemoryCapability` — бажаний API ексклюзивного memory-плагіна.
- `registerMemoryCapability` також може експонувати `publicArtifacts.listArtifacts(...)`,
  щоб плагіни-компаньйони могли споживати експортовані артефакти memory через
  `openclaw/plugin-sdk/memory-host-core`, а не звертатися до приватної структури
  конкретного memory-плагіна.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це сумісні з legacy API ексклюзивного memory-плагіна.
- `registerMemoryEmbeddingProvider` дозволяє активному memory-плагіну реєструвати один
  або кілька id адаптерів embedding (наприклад, `openai`, `gemini` або
  власний id, визначений плагіном).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, резолвиться відносно цих зареєстрованих
  id адаптерів.

### Події та життєвий цикл

| Метод                                        | Що він робить                |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Колбек прив’язки розмови     |

Приклади, поширені назви хуків і семантику guard див. у
[Хуки плагінів](/uk/plugins/hooks).

### Семантика рішень хуків

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник установлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник установлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник перебирає на себе dispatch, обробники з нижчим пріоритетом і стандартний шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник установлює це значення, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` трактується як відсутність рішення (так само, як пропуск `cancel`), а не як перевизначення.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна маршрутизація вхідних thread/topic. `metadata` залишайте для специфічних для каналу додаткових даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічного для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить Gateway, замість опори на внутрішні хуки `gateway:startup`.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID плагіна                                                                                  |
| `api.name`               | `string`                  | Назва для відображення                                                                      |
| `api.version`            | `string?`                 | Версія плагіна (необов’язково)                                                              |
| `api.description`        | `string?`                 | Опис плагіна (необов’язково)                                                                |
| `api.source`             | `string`                  | Шлях до джерела плагіна                                                                     |
| `api.rootDir`            | `string?`                 | Кореневий каталог плагіна (необов’язково)                                                   |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок runtime в пам’яті, якщо доступний)           |
| `api.pluginConfig`       | `Record<string, unknown>` | Специфічна для плагіна конфігурація з `plugins.entries.<id>.config`                         |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                            |
| `api.logger`             | `PluginLogger`            | Logger з областю дії (`debug`, `info`, `warn`, `error`)                                     |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Резолвить шлях відносно кореня плагіна                                                      |

## Внутрішня угода щодо модулів

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
  у production-коді. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Публічні поверхні вбудованих плагінів, завантажувані через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли), віддають перевагу
активному знімку конфігурації runtime, якщо OpenClaw уже запущено. Якщо знімок runtime
ще не існує, вони повертаються до резолвленого файлу конфігурації на диску.

Плагіни провайдерів можуть експонувати вузький локальний barrel-контракт плагіна, коли
певний helper навмисно є специфічним для провайдера і поки що не належить до
універсального підшляху SDK. Приклади вбудованих рішень:

- **Anthropic**: публічний seam `api.ts` / `contract-api.ts` для helper-функцій
  beta-header Claude і потоку `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує builder-и провайдерів,
  helper-и моделей за замовчуванням і builder-и realtime-провайдерів.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує builder провайдера,
  а також helper-и онбордингу/конфігурації.

<Warning>
  Production-код розширень також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо helper справді є спільним, перенесіть його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на capability, замість зв’язування двох плагінів між собою.
</Warning>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Опції `definePluginEntry` і `defineChannelPluginEntry`.
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
  <Card title="Внутрішня архітектура плагінів" icon="diagram-project" href="/uk/plugins/architecture">
    Поглиблена архітектура та модель capability.
  </Card>
</CardGroup>
