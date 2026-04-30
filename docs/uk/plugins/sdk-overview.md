---
read_when:
    - Потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібна довідка щодо всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: Plugin SDK overview
summary: Мапа імпортів, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-30T00:49:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1749ad99c55ffd14624b817aba963bd93ebe7976937138693177523bbe3aa88c
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Plugin SDK — це типізований контракт між plugins і ядром. Ця сторінка є
довідником щодо **того, що імпортувати** і **що можна реєструвати**.

<Note>
  Ця сторінка призначена для авторів plugins, які використовують `openclaw/plugin-sdk/*` всередині
  OpenClaw. Для зовнішніх застосунків, скриптів, панелей керування, завдань CI та розширень IDE,
  які хочуть запускати агентів через Gateway, натомість використовуйте
  [OpenClaw App SDK](/uk/concepts/openclaw-sdk) і пакет `@openclaw/sdk`.
</Note>

<Tip>
Шукаєте натомість практичний посібник? Почніть із [Створення plugins](/uk/plugins/building-plugins), використовуйте [Channel plugins](/uk/plugins/sdk-channel-plugins) для channel plugins, [Provider plugins](/uk/plugins/sdk-provider-plugins) для provider plugins і [Plugin hooks](/uk/plugins/hooks) для plugins інструментів або хуків життєвого циклу.
</Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це пришвидшує запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналів помічників entry/build
надавайте перевагу `openclaw/plugin-sdk/channel-core`; залишайте `openclaw/plugin-sdk/core` для
ширшої парасолькової поверхні та спільних помічників, як-от
`buildChannelConfigSchema`.

Для конфігурації каналу публікуйте JSON Schema, що належить каналу, через
`openclaw.plugin.json#channelConfigs`. Підшлях `plugin-sdk/channel-config-schema`
призначений для спільних примітивів схем і універсального збирача. Вбудовані
plugins OpenClaw використовують `plugin-sdk/bundled-channel-config-schema` для збережених
схем вбудованих каналів. Застарілі експорти сумісності залишаються в
`plugin-sdk/channel-config-schema-legacy`; жоден із підшляхів схем вбудованих каналів не є
шаблоном для нових plugins.

<Warning>
  Не імпортуйте provider- або channel-брендовані допоміжні межі (наприклад
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані plugins компонують універсальні підшляхи SDK всередині власних barrel-файлів `api.ts` /
  `runtime-api.ts`; споживачі ядра мають або використовувати ці локальні для plugin
  barrel-файли, або додавати вузький універсальний контракт SDK, коли потреба справді є
  міжканальною.

Невеликий набір допоміжних меж для вбудованих plugins усе ще з’являється у згенерованій мапі експортів,
коли вони мають відстежене використання власником. Вони існують лише для супроводу вбудованих plugins
і не рекомендовані як шляхи імпорту для нових сторонніх
plugins.

`openclaw/plugin-sdk/discord` і `openclaw/plugin-sdk/telegram-account` також
збережені як застарілі фасади сумісності для відстеженого використання власником. Не
копіюйте ці шляхи імпорту в нові plugins; натомість використовуйте ін’єктовані runtime-помічники та
універсальні підшляхи channel SDK.
</Warning>

## Довідник підшляхів

Plugin SDK надається як набір вузьких підшляхів, згрупованих за областями (entry plugin,
канал, provider, автентифікація, runtime, capability, пам’ять і зарезервовані
помічники вбудованих plugins). Повний каталог — згрупований і з посиланнями — див.
[Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів розміщений у `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Зворотний виклик `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація capabilities

| Метод                                            | Що реєструє                           |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)             |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агентів |
| `api.registerCliBackend(...)`                    | Локальний backend inference для CLI   |
| `api.registerChannel(...)`                       | Канал повідомлень                     |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні голосові сеанси в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео          |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                   |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                      |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                       |
| `api.registerWebFetchProvider(...)`              | Provider web fetch / scrape           |
| `api.registerWebSearchProvider(...)`             | Вебпошук                              |

### Інструменти й команди

| Метод                           | Що реєструє                                  |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (оминає LLM)           |

Команди Plugin можуть задавати `agentPromptGuidance`, коли агенту потрібна коротка,
належна команді підказка для маршрутизації. Тримайте цей текст про саму команду; не додавайте
provider- або plugin-специфічну політику до збирачів prompt ядра.

### Інфраструктура

| Метод                                          | Що реєструє                            |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Хук події                              |
| `api.registerHttpRoute(params)`                | HTTP endpoint Gateway                  |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Рекламодавець виявлення локального Gateway |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                         |
| `api.registerService(service)`                 | Фоновий сервіс                         |
| `api.registerInteractiveHandler(registration)` | Інтерактивний обробник                 |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime middleware для результатів інструментів |
| `api.registerMemoryPromptSupplement(builder)`  | Адитивна секція prompt поруч із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`  | Адитивний корпус пошуку/читання пам’яті |

### Host hooks для workflow plugins

Host hooks — це межі SDK для plugins, яким потрібно брати участь у життєвому циклі хоста,
а не лише додавати provider, канал або інструмент. Це
універсальні контракти; Plan Mode може їх використовувати, але так само можуть workflow-и погодження,
шлюзи політик робочого простору, фонові монітори, майстри налаштування та UI companion
plugins.

| Метод                                                                    | Контракт, яким він володіє                                                        |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Належний plugin JSON-сумісний стан сеансу, спроєктований через сеанси Gateway    |
| `api.enqueueNextTurnInjection(...)`                                      | Надійний exactly-once контекст, ін’єктований у наступний хід агента для одного сеансу |
| `api.registerTrustedToolPolicy(...)`                                     | Політика інструментів перед bundled/trusted pre-plugin, яка може блокувати або переписувати параметри інструментів |
| `api.registerToolMetadata(...)`                                          | Метадані відображення каталогу інструментів без зміни реалізації інструмента      |
| `api.registerCommand(...)`                                               | Scoped команди plugin; результати команд можуть задавати `continueAgent: true`    |
| `api.registerControlUiDescriptor(...)`                                   | Дескриптори внеску Control UI для поверхонь сеансу, інструмента, запуску або налаштувань |
| `api.registerRuntimeLifecycle(...)`                                      | Зворотні виклики очищення для runtime-ресурсів, що належать plugin, на шляхах reset/delete/reload |
| `api.registerAgentEventSubscription(...)`                                | Санітизовані підписки на події для стану workflow і моніторів                     |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Scratch-стан plugin для кожного запуску, очищений на термінальному життєвому циклі запуску |
| `api.registerSessionSchedulerJob(...)`                                   | Належні plugin записи завдань планувальника сеансів із детермінованим очищенням   |

Контракти навмисно розділяють повноваження:

- Зовнішні plugins можуть володіти session extensions, UI descriptors, commands, tool
  metadata, next-turn injections і звичайними hooks.
- Trusted tool policies виконуються перед звичайними hooks `before_tool_call` і є
  лише вбудованими, бо вони беруть участь у політиці безпеки хоста.
- Зарезервоване володіння командами доступне лише вбудованим plugins. Зовнішні plugins мають використовувати
  власні імена команд або псевдоніми.
- `allowPromptInjection=false` вимикає hooks, що змінюють prompt, зокрема
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  поля prompt із legacy `before_agent_start` і
  `enqueueNextTurnInjection`.

Приклади споживачів, що не належать до Plan:

| Архетип plugin               | Використані hooks                                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow погодження          | Session extension, command continuation, next-turn injection, UI descriptor                                                              |
| Шлюз політик бюджету/робочого простору | Trusted tool policy, tool metadata, session projection                                                                                   |
| Фоновий монітор життєвого циклу | Runtime lifecycle cleanup, agent event subscription, session scheduler ownership/cleanup, heartbeat prompt contribution, UI descriptor |
| Майстер налаштування або onboarding | Session extension, scoped commands, Control UI descriptor                                                                                |

<Note>
  Зарезервовані core admin namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
  вужчу область gateway method. Надавайте перевагу plugin-specific prefixes для
  методів, що належать plugin.
</Note>

<Accordion title="Коли використовувати middleware результатів інструментів">
  Вбудовані plugins можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
  їм потрібно переписати результат інструмента після виконання і до того, як runtime
  передасть цей результат назад у модель. Це trusted runtime-neutral
  межа для async output reducers, таких як tokenjuice.

Вбудовані plugins мають оголошувати `contracts.agentToolResultMiddleware` для кожного
цільового runtime, наприклад `["pi", "codex"]`. Зовнішні plugins
не можуть реєструвати це middleware; залишайте звичайні hooks OpenClaw plugin для роботи,
якій не потрібен таймінг результату інструмента перед моделлю. Старий Pi-only embedded
шлях реєстрації extension factory було вилучено.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дає plugin змогу рекламувати активний
Gateway у локальному транспорті виявлення, як-от mDNS/Bonjour. OpenClaw викликає
сервіс під час запуску Gateway, коли локальне виявлення ввімкнено, передає
поточні порти Gateway і несекретні TXT hint-дані та викликає повернений
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

Плагіни виявлення Gateway не повинні розглядати оголошені значення TXT як секрети або
автентифікацію. Виявлення є підказкою для маршрутизації; автентифікація Gateway і прив’язка TLS і далі
відповідають за довіру.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє реєстратор
- `descriptors`: дескриптори команд часу розбору, що використовуються для довідки кореневого CLI,
  маршрутизації та лінивої реєстрації CLI плагіна

Якщо ви хочете, щоб команда плагіна залишалася ліниво завантажуваною у звичайному шляху кореневого CLI,
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
        description: "Керування обліковими записами Matrix, перевіркою, пристроями та станом профілю",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте лише `commands`, тільки коли вам не потрібна лінива реєстрація кореневого CLI.
Цей шлях енергійної сумісності й надалі підтримується, але він не встановлює
заповнювачі на основі дескрипторів для лінивого завантаження під час розбору.

### Реєстрація бекенду CLI

`api.registerCliBackend(...)` дає плагіну змогу володіти типовою конфігурацією для локального
бекенду AI CLI, як-от `codex-cli`.

- `id` бекенду стає префіксом провайдера в посиланнях на моделі, як-от `codex-cli/gpt-5`.
- `config` бекенду використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  типових значень плагіна перед запуском CLI.
- Використовуйте `normalizeConfig`, коли бекенду потрібні переписування для сумісності після об’єднання
  (наприклад, нормалізація старих форм прапорців).

### Ексклюзивні слоти

| Метод                                      | Що він реєструє                                                                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Рушій контексту (один активний одночасно). Зворотний виклик `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг налаштувати додавання до промпта. |
| `api.registerMemoryCapability(capability)` | Уніфікована можливість пам’яті                                                                                                                               |
| `api.registerMemoryPromptSection(builder)` | Побудовник секції промпта пам’яті                                                                                                                            |
| `api.registerMemoryFlushPlan(resolver)`    | Резолвер плану скидання пам’яті                                                                                                                              |
| `api.registerMemoryRuntime(runtime)`       | Адаптер середовища виконання пам’яті                                                                                                                         |

### Адаптери ембедингів пам’яті

| Метод                                          | Що він реєструє                                      |
| ---------------------------------------------- | ---------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер ембедингів пам’яті для активного плагіна     |

- `registerMemoryCapability` є бажаним ексклюзивним API плагіна пам’яті.
- `registerMemoryCapability` також може відкривати `publicArtifacts.listArtifacts(...)`,
  щоб супутні плагіни могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core` замість доступу до приватної структури
  конкретного плагіна пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` є ексклюзивними API плагіна пам’яті зі збереженням сумісності зі спадщиною.
- `MemoryFlushPlan.model` може закріпити хід скидання за точним посиланням
  `provider/model`, як-от `ollama/qwen3:8b`, без успадкування активного ланцюга
  резервних варіантів.
- `registerMemoryEmbeddingProvider` дає активному плагіну пам’яті змогу зареєструвати один
  або кілька ідентифікаторів адаптерів ембедингів (наприклад `openai`, `gemini` або власний
  ідентифікатор, визначений плагіном).
- Користувацька конфігурація, як-от `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, резолвиться відносно цих зареєстрованих
  ідентифікаторів адаптерів.

### Події та життєвий цикл

| Метод                                        | Що він робить                         |
| -------------------------------------------- | ------------------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу       |
| `api.onConversationBindingResolved(handler)` | Зворотний виклик прив’язки розмови    |

Див. [хуки плагінів](/uk/plugins/hooks) для прикладів, поширених назв хуків і семантики
запобіжників.

### Семантика рішень хуків

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник бере на себе доставлення, обробники з нижчим пріоритетом і типовий шлях доставлення моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` трактується як відсутність рішення (так само, як пропуск `cancel`), а не як перевизначення.
- `message_received`: використовуйте типізоване поле `threadId`, коли потрібна маршрутизація вхідної гілки/теми. Залишайте `metadata` для специфічних для каналу додаткових даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічних для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, яким володіє Gateway, замість покладання на внутрішні хуки `gateway:startup`.
- `cron_changed`: спостерігайте за змінами життєвого циклу cron, яким володіє gateway. Використовуйте `event.job?.state?.nextRunAtMs` і `ctx.getCron?.()`, коли синхронізуєте зовнішні планувальники пробудження, і залишайте OpenClaw джерелом істини для перевірок настання часу та виконання.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                                  |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор плагіна                                                                                 |
| `api.name`               | `string`                  | Відображувана назва                                                                                   |
| `api.version`            | `string?`                 | Версія плагіна (необов’язково)                                                                        |
| `api.description`        | `string?`                 | Опис плагіна (необов’язково)                                                                          |
| `api.source`             | `string`                  | Шлях до джерела плагіна                                                                               |
| `api.rootDir`            | `string?`                 | Кореневий каталог плагіна (необов’язково)                                                             |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок середовища виконання в пам’яті, коли доступний)         |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація, специфічна для плагіна, з `plugins.entries.<id>.config`                                  |
| `api.runtime`            | `PluginRuntime`           | [Помічники середовища виконання](/uk/plugins/sdk-runtime)                                                |
| `api.logger`             | `PluginLogger`            | Логер з областю дії (`debug`, `info`, `warn`, `error`)                                                |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — полегшене вікно запуску/налаштування до повного входу |
| `api.resolvePath(input)` | `(string) => string`      | Розв’язати шлях відносно кореня плагіна                                                               |

## Внутрішня домовленість щодо модулів

У своєму плагіні використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Внутрішні експорти середовища виконання
  index.ts          # Точка входу плагіна
  setup-entry.ts    # Полегшений вхід лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний плагін через `openclaw/plugin-sdk/<your-plugin>`
  з production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK є лише зовнішнім контрактом.
</Warning>

Публічні поверхні вбудованого плагіна, завантажені через фасад (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` і подібні публічні вхідні файли), віддають перевагу
активному знімку конфігурації середовища виконання, коли OpenClaw уже працює. Якщо знімка середовища виконання
ще немає, вони повертаються до розв’язаної конфігурації на диску.
Запаковані фасади вбудованих плагінів слід завантажувати через завантажувачі фасадів плагінів
OpenClaw; прямі імпорти з `dist/extensions/...` оминають staged-дзеркала залежностей середовища виконання,
які запаковані встановлення використовують для залежностей, що належать плагіну.

Плагіни провайдерів можуть відкривати вузький локальний для плагіна barrel контракту, коли
помічник навмисно специфічний для провайдера й поки що не належить до загального підшляху SDK.
Вбудовані приклади:

- **Anthropic**: публічний шов `api.ts` / `contract-api.ts` для Claude
  beta-header і помічників потоку `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує побудовники провайдерів,
  помічники типових моделей і побудовники провайдерів realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує побудовник провайдера
  плюс помічники онбордингу/конфігурації.

<Warning>
  Production-коду розширень також слід уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо помічник справді спільний, підніміть його до нейтрального підшляху SDK,
  як-от `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливість, замість зв’язування двох плагінів між собою.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Параметри `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Помічники середовища виконання" icon="gears" href="/uk/plugins/sdk-runtime">
    Повна довідка простору імен `api.runtime`.
  </Card>
  <Card title="Налаштування й конфігурація" icon="sliders" href="/uk/plugins/sdk-setup">
    Пакування, маніфести та схеми конфігурації.
  </Card>
  <Card title="Тестування" icon="vial" href="/uk/plugins/sdk-testing">
    Тестові утиліти та правила lint.
  </Card>
  <Card title="Міграція SDK" icon="arrows-turn-right" href="/uk/plugins/sdk-migration">
    Міграція із застарілих поверхонь.
  </Card>
  <Card title="Внутрішня архітектура плагінів" icon="diagram-project" href="/uk/plugins/architecture">
    Глибока архітектура та модель можливостей.
  </Card>
</CardGroup>
