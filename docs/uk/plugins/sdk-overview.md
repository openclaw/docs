---
read_when:
    - Потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібна довідка про всі методи реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: Plugin SDK overview
summary: Мапа імпортів, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-05-04T18:18:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8187e7d4cfb9d6fb19bbdebfbaea0bb4d98fa5cea4742d0f82a765ae5bc60127
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK для плагінів є типізованим контрактом між плагінами та ядром. Ця сторінка є
довідником про **що імпортувати** і **що можна реєструвати**.

<Note>
  Ця сторінка призначена для авторів плагінів, які використовують `openclaw/plugin-sdk/*` всередині
  OpenClaw. Для зовнішніх застосунків, скриптів, панелей керування, CI-завдань і розширень IDE,
  які хочуть запускати агентів через Gateway, натомість використовуйте
  [OpenClaw App SDK](/uk/concepts/openclaw-sdk) і пакет `@openclaw/sdk`.
</Note>

<Tip>
Шукаєте натомість практичний посібник? Почніть із [Створення плагінів](/uk/plugins/building-plugins), використовуйте [Плагіни каналів](/uk/plugins/sdk-channel-plugins) для плагінів каналів, [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) для плагінів провайдерів і [Хуки Plugin](/uk/plugins/hooks) для плагінів хуків інструментів або життєвого циклу.
</Tip>

## Угода про імпорт

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях є невеликим самодостатнім модулем. Це прискорює запуск і
запобігає проблемам із циклічними залежностями. Для помічників входу/збірки,
специфічних для каналів, віддавайте перевагу `openclaw/plugin-sdk/channel-core`;
залишайте `openclaw/plugin-sdk/core` для ширшої поверхні-парасолі та спільних
помічників, таких як `buildChannelConfigSchema`.

Для конфігурації каналу публікуйте JSON Schema, що належить каналу, через
`openclaw.plugin.json#channelConfigs`. Підшлях `plugin-sdk/channel-config-schema`
призначений для спільних примітивів схем і загального builder. Вбудовані
плагіни OpenClaw використовують `plugin-sdk/bundled-channel-config-schema` для
збережених схем вбудованих каналів. Застарілі експорти сумісності залишаються в
`plugin-sdk/channel-config-schema-legacy`; жоден підшлях вбудованих схем не є
шаблоном для нових плагінів.

<Warning>
  Не імпортуйте зручні шви, брендовані провайдером або каналом (наприклад
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані плагіни компонують загальні підшляхи SDK у власних барелях `api.ts` /
  `runtime-api.ts`; споживачі ядра мають або використовувати ці локальні для
  плагіна барелі, або додати вузький загальний контракт SDK, коли потреба справді
  є міжканальною.

Невеликий набір допоміжних швів вбудованих плагінів усе ще з’являється у
згенерованій мапі експортів, коли вони мають відстежене використання власником.
Вони існують лише для супроводу вбудованих плагінів і не рекомендовані як шляхи
імпорту для нових сторонніх плагінів.

`openclaw/plugin-sdk/discord` і `openclaw/plugin-sdk/telegram-account` також
збережені як застарілі фасади сумісності для відстеженого використання
власником. Не копіюйте ці шляхи імпорту в нові плагіни; натомість використовуйте
ін’єктовані runtime-помічники та загальні підшляхи SDK каналів.
</Warning>

## Довідник підшляхів

SDK для плагінів надається як набір вузьких підшляхів, згрупованих за сферами
(вхід плагіна, канал, провайдер, автентифікація, runtime, capability, пам’ять і
зарезервовані помічники вбудованих плагінів). Повний каталог, згрупований і
пов’язаний посиланнями, дивіться в [Підшляхи SDK для плагінів](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Callback `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація capability

| Метод                                            | Що він реєструє                         |
| ------------------------------------------------ | --------------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)               |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агентів |
| `api.registerCliBackend(...)`                    | Локальний CLI inference backend         |
| `api.registerChannel(...)`                       | Канал повідомлень                       |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT             |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі  |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні голосові сеанси в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео            |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                     |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                        |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                         |
| `api.registerWebFetchProvider(...)`              | Провайдер web fetch / scrape            |
| `api.registerWebSearchProvider(...)`             | Вебпошук                                |

### Інструменти та команди

| Метод                         | Що він реєструє                              |
| ----------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (оминає LLM)          |

Команди плагінів можуть задавати `agentPromptGuidance`, коли агенту потрібна
коротка підказка маршрутизації, що належить команді. Тримайте цей текст про
саму команду; не додавайте політики, специфічної для провайдера або плагіна, до
builder prompt ядра.

### Інфраструктура

| Метод                                          | Що він реєструє                         |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Хук події                               |
| `api.registerHttpRoute(params)`                | HTTP endpoint Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод Gateway                       |
| `api.registerGatewayDiscoveryService(service)` | Локальний рекламодавець виявлення Gateway |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                          |
| `api.registerService(service)`                 | Фонова служба                           |
| `api.registerInteractiveHandler(registration)` | Інтерактивний обробник                  |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime middleware результатів інструментів |
| `api.registerMemoryPromptSupplement(builder)`  | Додатковий розділ prompt поруч із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`  | Додатковий корпус пошуку/читання пам’яті |

### Хуки хоста для плагінів workflow

Хуки хоста є швами SDK для плагінів, яким потрібно брати участь у життєвому
циклі хоста, а не лише додавати провайдера, канал або інструмент. Це загальні
контракти; режим Plan може їх використовувати, але так само можуть workflow
затверджень, шлюзи політики workspace, фонові монітори, майстри налаштування та
супровідні UI-плагіни.

| Метод                                                                    | Контракт, яким він володіє                                                                                                         |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | JSON-сумісний стан сеансу, що належить плагіну та проєктується через сеанси Gateway                                                 |
| `api.enqueueNextTurnInjection(...)`                                      | Стійкий exactly-once контекст, ін’єктований у наступний хід агента для одного сеансу                                                |
| `api.registerTrustedToolPolicy(...)`                                     | Політика інструментів pre-plugin для вбудованих/довірених плагінів, яка може блокувати або переписувати параметри інструмента       |
| `api.registerToolMetadata(...)`                                          | Метадані відображення каталогу інструментів без зміни реалізації інструмента                                                        |
| `api.registerCommand(...)`                                               | Обмежені плагіном команди; результати команд можуть задавати `continueAgent: true`; нативні команди Discord підтримують `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Дескриптори внесків Control UI для поверхонь сеансу, інструмента, запуску або налаштувань                                           |
| `api.registerRuntimeLifecycle(...)`                                      | Callback-и очищення для runtime-ресурсів, що належать плагіну, на шляхах reset/delete/reload                                        |
| `api.registerAgentEventSubscription(...)`                                | Санітизовані підписки на події для стану workflow і моніторів                                                                       |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Тимчасовий стан плагіна для окремого запуску, що очищується під час термінального життєвого циклу запуску                           |
| `api.registerSessionSchedulerJob(...)`                                   | Записи завдань планувальника сеансів, що належать плагіну, з детермінованим очищенням                                               |

Контракти навмисно розділяють повноваження:

- Зовнішні плагіни можуть володіти розширеннями сеансів, дескрипторами UI,
  командами, метаданими інструментів, ін’єкціями наступного ходу та звичайними
  хуками.
- Довірені політики інструментів виконуються перед звичайними хуками
  `before_tool_call` і доступні лише для вбудованих плагінів, оскільки беруть
  участь у політиці безпеки хоста.
- Зарезервоване володіння командами доступне лише для вбудованих плагінів.
  Зовнішні плагіни мають використовувати власні назви команд або псевдоніми.
- `allowPromptInjection=false` вимикає хуки, що змінюють prompt, включно з
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  полями prompt із застарілого `before_agent_start` і
  `enqueueNextTurnInjection`.

Приклади споживачів, що не належать до Plan:

| Архетип плагіна              | Використані хуки                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Workflow затвердження        | Розширення сеансу, продовження команди, ін’єкція наступного ходу, дескриптор UI                                                       |
| Шлюз політики бюджету/workspace | Довірена політика інструментів, метадані інструментів, проєкція сеансу                                                            |
| Фоновий монітор життєвого циклу | Очищення runtime lifecycle, підписка на події агента, володіння/очищення планувальника сеансів, внесок heartbeat prompt, дескриптор UI |
| Майстер налаштування або onboarding | Розширення сеансу, обмежені команди, дескриптор Control UI                                                                      |

<Note>
  Зарезервовані простори імен адміністратора ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо плагін намагається призначити
  вужчий scope методу Gateway. Віддавайте перевагу префіксам, специфічним для плагіна, для
  методів, що належать плагіну.
</Note>

<Accordion title="Коли використовувати middleware результатів інструментів">
  Вбудовані плагіни можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
  їм потрібно переписати результат інструмента після виконання і до того, як runtime
  передасть цей результат назад у модель. Це довірений runtime-нейтральний шов
  для асинхронних редукторів виводу, таких як tokenjuice.

Вбудовані плагіни мають оголошувати `contracts.agentToolResultMiddleware` для кожного
цільового runtime, наприклад `["pi", "codex"]`. Зовнішні плагіни
не можуть реєструвати це middleware; залишайте звичайні хуки плагінів OpenClaw для роботи,
якій не потрібен timing результату інструмента перед моделлю. Старий шлях реєстрації
вбудованої фабрики розширень лише для Pi було видалено.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дає змогу Plugin оголошувати активний
Gateway у локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw викликає
сервіс під час запуску Gateway, коли локальне виявлення ввімкнено, передає
поточні порти Gateway і несекретні дані підказок TXT, а також викликає повернений
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

Plugin-и виявлення Gateway не повинні трактувати оголошені значення TXT як секрети або
автентифікацію. Виявлення є підказкою маршрутизації; автентифікація Gateway і прив’язування TLS
і далі відповідають за довіру.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє реєстратор
- `descriptors`: дескриптори команд під час розбору, що використовуються для довідки кореневого CLI,
  маршрутизації та лінивої реєстрації CLI Plugin

Якщо потрібно, щоб команда Plugin залишалася ліниво завантажуваною у звичайному шляху кореневого CLI,
надайте `descriptors`, які охоплюють кожен корінь команди верхнього рівня, що відкриває цей
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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте `commands` окремо лише тоді, коли вам не потрібна лінива реєстрація кореневого CLI.
Цей шлях активної сумісності й надалі підтримується, але він не встановлює
заповнювачі на основі дескрипторів для лінивого завантаження під час розбору.

### Реєстрація бекенду CLI

`api.registerCliBackend(...)` дає змогу Plugin володіти типовою конфігурацією для локального
бекенду AI CLI, такого як `codex-cli`.

- `id` бекенду стає префіксом провайдера в посиланнях на моделі, як-от `codex-cli/gpt-5`.
- `config` бекенду використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  типових налаштувань Plugin перед запуском CLI.
- Використовуйте `normalizeConfig`, коли бекенду потрібні переписування сумісності після об’єднання
  (наприклад, нормалізація старих форм прапорців).
- Використовуйте `resolveExecutionArgs` для переписування argv в межах запиту, яке належить до
  діалекту CLI, наприклад зіставлення рівнів мислення OpenClaw із нативним прапорцем зусилля.

### Ексклюзивні слоти

| Метод                                      | Що реєструє                                                                                                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Рушій контексту (активний один за раз). Callback `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг адаптувати доповнення до промпта. |
| `api.registerMemoryCapability(capability)` | Уніфікована можливість пам’яті                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | Побудовник секції промпта пам’яті                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану скидання пам’яті                                                                                                                            |
| `api.registerMemoryRuntime(runtime)`       | Адаптер середовища виконання пам’яті                                                                                                                       |

### Адаптери embedding пам’яті

| Метод                                          | Що реєструє                                |
| ---------------------------------------------- | ------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding пам’яті для активного Plugin |

- `registerMemoryCapability` є рекомендованим API ексклюзивного Plugin пам’яті.
- `registerMemoryCapability` також може відкривати `publicArtifacts.listArtifacts(...)`,
  щоб супутні Plugin могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core`, а не звертатися до приватної структури конкретного
  Plugin пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` є API ексклюзивного Plugin пам’яті із сумісністю зі спадщиною.
- `MemoryFlushPlan.model` може закріпити хід скидання за точним посиланням
  `provider/model`, таким як `ollama/qwen3:8b`, без успадкування активного fallback
  ланцюжка.
- `registerMemoryEmbeddingProvider` дає змогу активному Plugin пам’яті зареєструвати один
  або кілька id адаптерів embedding (наприклад `openai`, `gemini` або власний
  id, визначений Plugin).
- Конфігурація користувача, як-от `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, зіставляється з цими зареєстрованими
  id адаптерів.

### Події та життєвий цикл

| Метод                                        | Що робить                      |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Типізований hook життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Callback прив’язки розмови     |

Див. [hooks Plugin](/uk/plugins/hooks) для прикладів, поширених назв hook і семантики guard.

### Семантика рішень hook

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник установлює його, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` трактується як відсутність рішення (те саме, що пропустити `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник установлює його, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` трактується як відсутність рішення (те саме, що пропустити `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник заявляє dispatch, обробники з нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник установлює його, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` трактується як відсутність рішення (те саме, що пропустити `cancel`), а не як перевизначення.
- `message_received`: використовуйте типізоване поле `threadId`, коли потрібна вхідна маршрутизація гілки/теми. Залишайте `metadata` для специфічних для каналу додаткових даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічних для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, яким володіє gateway, замість покладання на внутрішні hooks `gateway:startup`.
- `cron_changed`: спостерігайте за змінами життєвого циклу cron, яким володіє gateway. Використовуйте `event.job?.state?.nextRunAtMs` і `ctx.getCron?.()` під час синхронізації зовнішніх планувальників пробудження, а OpenClaw залишайте джерелом істини для перевірок строків і виконання.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                           |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id Plugin                                                                                      |
| `api.name`               | `string`                  | Відображувана назва                                                                            |
| `api.version`            | `string?`                 | Версія Plugin (необов’язково)                                                                  |
| `api.description`        | `string?`                 | Опис Plugin (необов’язково)                                                                    |
| `api.source`             | `string`                  | Шлях джерела Plugin                                                                            |
| `api.rootDir`            | `string?`                 | Кореневий каталог Plugin (необов’язково)                                                       |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок runtime в пам’яті, коли доступний)              |
| `api.pluginConfig`       | `Record<string, unknown>` | Специфічна для Plugin конфігурація з `plugins.entries.<id>.config`                             |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                               |
| `api.logger`             | `PluginLogger`            | Scoped logger (`debug`, `info`, `warn`, `error`)                                               |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це легке вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Resolve path відносно кореня Plugin                                                            |

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
  з production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK є лише зовнішнім контрактом.
</Warning>

Публічні поверхні bundled Plugin, завантажені через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` і подібні публічні entry-файли), віддають перевагу
активному знімку runtime config, коли OpenClaw уже працює. Якщо знімка runtime
ще немає, вони повертаються до розв’язаної конфігурації на диску.
Упаковані facades bundled Plugin мають завантажуватися через facade loaders Plugin
OpenClaw; прямі імпорти з `dist/extensions/...` оминають маніфест
і перевірки runtime sidecar, які встановлення пакетів використовують для коду, яким володіє Plugin.

Provider Plugin можуть відкривати вузький локальний для Plugin barrel контракту, коли
helper навмисно є специфічним для провайдера і ще не належить до загального підшляху SDK.
Bundled приклади:

- **Anthropic**: публічний seam `api.ts` / `contract-api.ts` для Claude
  beta-header і helpers потоків `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує provider builders,
  helpers типової моделі та realtime provider builders.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує provider builder
  плюс helpers onboarding/config.

<Warning>
  Production-коду Extension також слід уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо helper справді спільний, підніміть його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або інша
  поверхня, орієнтована на capability, замість зв’язування двох Plugin між собою.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Опції `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Допоміжні засоби середовища виконання" icon="gears" href="/uk/plugins/sdk-runtime">
    Повна довідка простору імен `api.runtime`.
  </Card>
  <Card title="Налаштування та конфігурація" icon="sliders" href="/uk/plugins/sdk-setup">
    Пакування, маніфести та схеми конфігурації.
  </Card>
  <Card title="Тестування" icon="vial" href="/uk/plugins/sdk-testing">
    Утиліти для тестування та правила lint.
  </Card>
  <Card title="Міграція SDK" icon="arrows-turn-right" href="/uk/plugins/sdk-migration">
    Міграція із застарілих поверхонь.
  </Card>
  <Card title="Внутрішній устрій Plugin" icon="diagram-project" href="/uk/plugins/architecture">
    Поглиблена архітектура та модель можливостей.
  </Card>
</CardGroup>
