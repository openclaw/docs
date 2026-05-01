---
read_when:
    - Потрібно знати, з якого підшляху SDK виконувати імпорт
    - Вам потрібна довідка щодо всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: Plugin SDK overview
summary: Мапа імпортів, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-05-01T20:40:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 28da709ac7dc86e6d5b553b6c8ecaed105c68de63f94804bc5aed56ebc6c5de9
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin — це типізований контракт між Plugin і ядром. Ця сторінка є
довідником щодо **того, що імпортувати** і **що можна реєструвати**.

<Note>
  Ця сторінка призначена для авторів Plugin, які використовують `openclaw/plugin-sdk/*` всередині
  OpenClaw. Для зовнішніх застосунків, скриптів, панелей керування, завдань CI та розширень IDE,
  які хочуть запускати агентів через Gateway, натомість використовуйте
  [OpenClaw App SDK](/uk/concepts/openclaw-sdk) і пакет `@openclaw/sdk`.
</Note>

<Tip>
Шукаєте натомість практичний посібник? Почніть із [Створення Plugin](/uk/plugins/building-plugins), використовуйте [Channel plugins](/uk/plugins/sdk-channel-plugins) для каналів Plugin, [Provider plugins](/uk/plugins/sdk-provider-plugins) для провайдерів Plugin і [Plugin hooks](/uk/plugins/hooks) для Plugin інструментів або хуків життєвого циклу.
</Tip>

## Угода імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це забезпечує швидкий запуск і
запобігає проблемам із циклічними залежностями. Для допоміжних засобів входу/збирання,
специфічних для каналу, надавайте перевагу `openclaw/plugin-sdk/channel-core`; залишайте
`openclaw/plugin-sdk/core` для ширшої поверхні та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

Для конфігурації каналу публікуйте JSON Schema, що належить каналу, через
`openclaw.plugin.json#channelConfigs`. Підшлях `plugin-sdk/channel-config-schema`
призначений для спільних примітивів схем і загального конструктора. Вбудовані Plugin
OpenClaw використовують `plugin-sdk/bundled-channel-config-schema` для збережених
схем вбудованих каналів. Застарілі експорти сумісності залишаються в
`plugin-sdk/channel-config-schema-legacy`; жоден із підшляхів вбудованих схем не є
шаблоном для нових Plugin.

<Warning>
  Не імпортуйте зручні шви, брендовані провайдерами або каналами (наприклад
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані Plugin компонують загальні підшляхи SDK усередині власних барелів `api.ts` /
  `runtime-api.ts`; споживачі ядра мають або використовувати ці локальні для Plugin
  барелі, або додати вузький загальний контракт SDK, коли потреба справді
  міжканальна.

Невеликий набір допоміжних швів вбудованих Plugin досі з’являється в згенерованій мапі
експортів, коли вони мають відстежене використання власником. Вони існують лише для
обслуговування вбудованих Plugin і не рекомендовані як шляхи імпорту для нових сторонніх
Plugin.

`openclaw/plugin-sdk/discord` і `openclaw/plugin-sdk/telegram-account` також збережено
як застарілі фасади сумісності для відстеженого використання власником. Не копіюйте
ці шляхи імпорту в нові Plugin; натомість використовуйте ін’єктовані runtime-помічники
та загальні підшляхи SDK каналів.
</Warning>

## Довідник підшляхів

SDK Plugin доступний як набір вузьких підшляхів, згрупованих за областями (вхід
Plugin, канал, провайдер, автентифікація, runtime, можливість, пам’ять і зарезервовані
допоміжні засоби вбудованих Plugin). Повний каталог — згрупований і з посиланнями —
див. у [Підшляхи SDK Plugin](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Зворотний виклик `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Метод                                            | Що він реєструє                         |
| ------------------------------------------------ | --------------------------------------- |
| `api.registerProvider(...)`                      | Текстове виведення (LLM)                |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний бекенд CLI-виведення          |
| `api.registerChannel(...)`                       | Канал повідомлень                       |
| `api.registerSpeechProvider(...)`                | Text-to-speech / STT-синтез             |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі  |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні голосові сеанси в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео            |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                     |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                        |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                         |
| `api.registerWebFetchProvider(...)`              | Провайдер веб-отримання / скрейпінгу    |
| `api.registerWebSearchProvider(...)`             | Вебпошук                                |

### Інструменти та команди

| Метод                          | Що він реєструє                                |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (обходить LLM)           |

Команди Plugin можуть задавати `agentPromptGuidance`, коли агенту потрібна коротка
підказка маршрутизації, що належить команді. Тримайте цей текст про саму команду;
не додавайте політику, специфічну для провайдера або Plugin, до побудовників промптів ядра.

### Інфраструктура

| Метод                                          | Що він реєструє                           |
| ---------------------------------------------- | ----------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Хук події                                 |
| `api.registerHttpRoute(params)`                | HTTP-ендпоїнт Gateway                     |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод Gateway                         |
| `api.registerGatewayDiscoveryService(service)` | Рекламодавець локального виявлення Gateway |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                            |
| `api.registerService(service)`                 | Фонова служба                             |
| `api.registerInteractiveHandler(registration)` | Інтерактивний обробник                    |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime-посередник результатів інструментів |
| `api.registerMemoryPromptSupplement(builder)`  | Додатковий розділ промпта поруч із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`  | Додатковий корпус пошуку/читання пам’яті  |

### Хуки хоста для workflow-Plugin

Хуки хоста — це шви SDK для Plugin, яким потрібно брати участь у життєвому циклі
хоста, а не лише додавати провайдера, канал або інструмент. Це загальні контракти;
Plan Mode може їх використовувати, але так само можуть workflow-процеси затвердження,
шлюзи політик робочого простору, фонові монітори, майстри налаштування та супровідні
Plugin інтерфейсу.

| Метод                                                                    | Контракт, яким він володіє                                                        |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Стан сеансу, що належить Plugin, JSON-сумісний і проєктується через сеанси Gateway |
| `api.enqueueNextTurnInjection(...)`                                      | Стійкий exactly-once контекст, ін’єктований у наступний хід агента для одного сеансу |
| `api.registerTrustedToolPolicy(...)`                                     | Політика інструментів вбудованого/довіреного pre-plugin, яка може блокувати або переписувати параметри інструмента |
| `api.registerToolMetadata(...)`                                          | Метадані відображення каталогу інструментів без зміни реалізації інструмента      |
| `api.registerCommand(...)`                                               | Обмежені команди Plugin; результати команд можуть задавати `continueAgent: true`  |
| `api.registerControlUiDescriptor(...)`                                   | Дескриптори внеску Control UI для поверхонь сеансу, інструмента, запуску або налаштувань |
| `api.registerRuntimeLifecycle(...)`                                      | Зворотні виклики очищення для runtime-ресурсів, що належать Plugin, на шляхах reset/delete/reload |
| `api.registerAgentEventSubscription(...)`                                | Санітизовані підписки на події для стану workflow і моніторів                     |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Тимчасовий стан Plugin на запуск, очищений під час термінального життєвого циклу запуску |
| `api.registerSessionSchedulerJob(...)`                                   | Записи завдань планувальника сеансів, що належать Plugin, із детермінованим очищенням |

Контракти навмисно розділяють повноваження:

- Зовнішні Plugin можуть володіти розширеннями сеансів, дескрипторами UI, командами, метаданими інструментів, ін’єкціями наступного ходу та звичайними хуками.
- Довірені політики інструментів запускаються перед звичайними хуками `before_tool_call` і доступні лише для вбудованих, оскільки беруть участь у політиці безпеки хоста.
- Зарезервоване володіння командами доступне лише для вбудованих. Зовнішні Plugin мають використовувати власні назви команд або псевдоніми.
- `allowPromptInjection=false` вимикає хуки, що змінюють промпт, зокрема
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  поля промпта зі застарілого `before_agent_start` і
  `enqueueNextTurnInjection`.

Приклади споживачів поза Plan:

| Архетип Plugin                | Використані хуки                                                                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow затвердження         | Розширення сеансу, продовження команди, ін’єкція наступного ходу, дескриптор UI                                                        |
| Шлюз політики бюджету/робочого простору | Довірена політика інструментів, метадані інструментів, проєкція сеансу                                                         |
| Фоновий монітор життєвого циклу | Очищення життєвого циклу runtime, підписка на події агента, володіння/очищення планувальника сеансів, внесок heartbeat-промпта, дескриптор UI |
| Майстер налаштування або onboarding | Розширення сеансу, обмежені команди, дескриптор Control UI                                                                       |

<Note>
  Зарезервовані core admin простори назв (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо Plugin намагається
  призначити вужчу область методу Gateway. Надавайте перевагу префіксам, специфічним
  для Plugin, для методів, що належать Plugin.
</Note>

<Accordion title="Коли використовувати посередник результатів інструментів">
  Вбудовані Plugin можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
  їм потрібно переписати результат інструмента після виконання й до того, як runtime
  передасть цей результат назад у модель. Це довірений runtime-нейтральний
  шов для асинхронних редукторів виводу, таких як tokenjuice.

Вбудовані Plugin мають оголошувати `contracts.agentToolResultMiddleware` для кожного
цільового runtime, наприклад `["pi", "codex"]`. Зовнішні Plugin
не можуть реєструвати цей посередник; залишайте звичайні хуки Plugin OpenClaw для роботи,
яка не потребує pre-model таймінгу результатів інструментів. Старий шлях реєстрації
вбудованої фабрики розширень лише для Pi було вилучено.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дає Plugin змогу рекламувати активний
Gateway у локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw викликає
службу під час запуску Gateway, коли локальне виявлення ввімкнено, передає поточні
порти Gateway і несекретні TXT-підказки, а також викликає повернений обробник
`stop` під час завершення роботи Gateway.

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

Plugin-и виявлення Gateway не повинні розглядати рекламовані значення TXT як секрети або
автентифікацію. Виявлення є підказкою для маршрутизації; автентифікація Gateway і закріплення TLS усе ще
відповідають за довіру.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє реєстратор
- `descriptors`: дескриптори команд під час розбору, що використовуються для довідки кореневого CLI,
  маршрутизації та ледачої реєстрації CLI Plugin-а

Якщо ви хочете, щоб команда Plugin-а залишалася ліниво завантажуваною у звичайному шляху кореневого CLI,
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

Використовуйте лише `commands`, тільки коли вам не потрібна ледача реєстрація кореневого CLI.
Цей eager-шлях сумісності залишається підтримуваним, але він не встановлює
заповнювачі на основі дескрипторів для ледачого завантаження під час розбору.

### Реєстрація бекенда CLI

`api.registerCliBackend(...)` дає Plugin-у змогу володіти типовою конфігурацією для локального
бекенда AI CLI, такого як `codex-cli`.

- `id` бекенда стає префіксом провайдера в посиланнях на моделі, як-от `codex-cli/gpt-5`.
- `config` бекенда використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw зливає `agents.defaults.cliBackends.<id>` поверх
  типових значень Plugin-а перед запуском CLI.
- Використовуйте `normalizeConfig`, коли бекенду потрібні переписування сумісності після злиття
  (наприклад, нормалізація старих форм прапорців).

### Ексклюзивні слоти

| Метод                                      | Що він реєструє                                                                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Рушій контексту (одночасно активний лише один). Callback `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг адаптувати доповнення до промпта. |
| `api.registerMemoryCapability(capability)` | Уніфікована можливість пам’яті                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | Побудовник секції промпта пам’яті                                                                                                                                |
| `api.registerMemoryFlushPlan(resolver)`    | Резолвер плану скидання пам’яті                                                                                                                                  |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime пам’яті                                                                                                                                          |

### Адаптери вбудовування пам’яті

| Метод                                          | Що він реєструє                              |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер вбудовування пам’яті для активного Plugin-а |

- `registerMemoryCapability` є бажаним ексклюзивним API Plugin-а пам’яті.
- `registerMemoryCapability` також може відкривати `publicArtifacts.listArtifacts(...)`,
  щоб супутні Plugin-и могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core`, а не звертатися до приватної структури конкретного
  Plugin-а пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` є ексклюзивними API Plugin-а пам’яті з підтримкою сумісності зі спадковими версіями.
- `MemoryFlushPlan.model` може закріпити хід скидання за точним посиланням
  `provider/model`, таким як `ollama/qwen3:8b`, без успадкування активного
  ланцюга fallback.
- `registerMemoryEmbeddingProvider` дає активному Plugin-у пам’яті змогу зареєструвати один
  або кілька id адаптерів вбудовування (наприклад, `openai`, `gemini` або користувацький
  id, визначений Plugin-ом).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, розв’язується відносно цих зареєстрованих
  id адаптерів.

### Події та життєвий цикл

| Метод                                        | Що він робить                  |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Callback прив’язки розмови      |

Див. [Хуки Plugin-а](/uk/plugins/hooks) для прикладів, поширених назв хуків і семантики guard.

### Семантика рішень хуків

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник його встановлює, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник його встановлює, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник заявляє dispatch, обробники з нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник його встановлює, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` трактується як відсутність рішення (так само, як пропуск `cancel`), а не як перевизначення.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна маршрутизація вхідних гілок/тем. Зберігайте `metadata` для специфічних для каналу додаткових даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId` перед fallback до специфічного для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, яким володіє Gateway, замість покладання на внутрішні хуки `gateway:startup`.
- `cron_changed`: спостерігайте за змінами життєвого циклу Cron, яким володіє Gateway. Використовуйте `event.job?.state?.nextRunAtMs` і `ctx.getCron?.()` під час синхронізації зовнішніх планувальників пробудження, і залишайте OpenClaw джерелом істини для перевірок строку виконання та виконання.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                                     |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id Plugin-а                                                                                              |
| `api.name`               | `string`                  | Відображувана назва                                                                                      |
| `api.version`            | `string?`                 | Версія Plugin-а (необов’язково)                                                                          |
| `api.description`        | `string?`                 | Опис Plugin-а (необов’язково)                                                                            |
| `api.source`             | `string`                  | Шлях джерела Plugin-а                                                                                    |
| `api.rootDir`            | `string?`                 | Кореневий каталог Plugin-а (необов’язково)                                                               |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний runtime-знімок у пам’яті, коли доступний)                         |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація, специфічна для Plugin-а, з `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Runtime-хелпери](/uk/plugins/sdk-runtime)                                                                  |
| `api.logger`             | `PluginLogger`            | Обмежений за областю logger (`debug`, `info`, `warn`, `error`)                                           |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це легке стартове/setup-вікно перед повним entry point |
| `api.resolvePath(input)` | `(string) => string`      | Розв’язати шлях відносно кореня Plugin-а                                                                 |

## Конвенція внутрішніх модулів

У межах вашого Plugin-а використовуйте локальні barrel-файли для внутрішніх імпортів:

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

Публічні поверхні bundled Plugin-а, завантажені через фасад (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` і подібні публічні entry-файли), віддають перевагу
активному runtime-знімку конфігурації, коли OpenClaw уже запущено. Якщо runtime-знімка
ще немає, вони fallback до розв’язаної конфігурації на диску.
Фасади packaged bundled Plugin-а слід завантажувати через фасадні завантажувачі Plugin-ів OpenClaw;
прямі імпорти з `dist/extensions/...` обходять маніфест
і runtime-перевірки sidecar, які packaged-інсталяції використовують для коду, яким володіє Plugin.

Provider Plugin-и можуть відкривати вузький barrel контракту, локальний для Plugin-а, коли
хелпер навмисно є специфічним для провайдера і ще не належить до загального підшляху SDK.
Bundled-приклади:

- **Anthropic**: публічна межа `api.ts` / `contract-api.ts` для Claude
  beta-header і stream-хелперів `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує побудовники провайдера,
  хелпери типових моделей і побудовники realtime-провайдера.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує побудовник провайдера
  плюс хелпери onboarding/config.

<Warning>
  Production-код Extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо хелпер справді спільний, піднесіть його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або інша
  поверхня, орієнтована на можливості, замість зв’язування двох Plugin-ів між собою.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Опції `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime-хелпери" icon="gears" href="/uk/plugins/sdk-runtime">
    Повний довідник простору імен `api.runtime`.
  </Card>
  <Card title="Setup і конфігурація" icon="sliders" href="/uk/plugins/sdk-setup">
    Пакування, маніфести та схеми конфігурації.
  </Card>
  <Card title="Тестування" icon="vial" href="/uk/plugins/sdk-testing">
    Тестові утиліти та правила lint.
  </Card>
  <Card title="Міграція SDK" icon="arrows-turn-right" href="/uk/plugins/sdk-migration">
    Міграція із застарілих поверхонь.
  </Card>
  <Card title="Внутрішня архітектура Plugin-а" icon="diagram-project" href="/uk/plugins/architecture">
    Глибока архітектура та модель можливостей.
  </Card>
</CardGroup>
