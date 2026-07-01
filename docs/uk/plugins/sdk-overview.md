---
read_when:
    - Потрібно знати, з якого підшляху SDK виконувати імпорт
    - Вам потрібна довідка щодо всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: Plugin SDK overview
summary: Довідник мапи імпортів, API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-07-01T20:33:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK плагінів — це типізований контракт між плагінами та ядром. Ця сторінка є
довідником щодо **того, що імпортувати** і **що можна зареєструвати**.

<Note>
  Ця сторінка призначена для авторів плагінів, які використовують `openclaw/plugin-sdk/*` всередині
  OpenClaw. Для зовнішніх застосунків, скриптів, панелей керування, завдань CI та розширень IDE,
  які хочуть запускати агентів через Gateway, натомість використовуйте
  [інтеграції Gateway для зовнішніх застосунків](/uk/gateway/external-apps).
</Note>

<Tip>
Шукаєте натомість практичний посібник? Почніть із [створення плагінів](/uk/plugins/building-plugins), використовуйте [плагіни каналів](/uk/plugins/sdk-channel-plugins) для плагінів каналів, [плагіни провайдерів](/uk/plugins/sdk-provider-plugins) для плагінів провайдерів, [плагіни бекенду CLI](/uk/plugins/cli-backend-plugins) для локальних AI-бекендів CLI і [хуки плагінів](/uk/plugins/hooks) для плагінів інструментів або хуків життєвого циклу.
</Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це зберігає швидкий запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналів entry/build-хелперів
віддавайте перевагу `openclaw/plugin-sdk/channel-core`; залишайте `openclaw/plugin-sdk/core` для
ширшої парасолькової поверхні та спільних хелперів, як-от
`buildChannelConfigSchema`.

Для конфігурації каналу публікуйте JSON Schema, якою володіє канал, через
`openclaw.plugin.json#channelConfigs`. Підшлях `plugin-sdk/channel-config-schema`
призначений для спільних примітивів схем і універсального builder. Вбудовані
плагіни OpenClaw використовують `plugin-sdk/bundled-channel-config-schema` для збережених
схем вбудованих каналів. Застарілі експорти сумісності залишаються в
`plugin-sdk/channel-config-schema-legacy`; жоден із підшляхів вбудованих схем не є
шаблоном для нових плагінів.

<Warning>
  Не імпортуйте branded convenience seams провайдерів або каналів (наприклад
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані плагіни компонують універсальні підшляхи SDK усередині власних barrel-файлів `api.ts` /
  `runtime-api.ts`; споживачі ядра мають або використовувати ці локальні для плагіна
  barrel-файли, або додати вузький універсальний контракт SDK, коли потреба справді
  є міжканальною.

Невеликий набір helper seams вбудованих плагінів усе ще з’являється у згенерованій мапі експортів,
коли для них відстежено використання власником. Вони існують лише для підтримки вбудованих плагінів
і не рекомендовані як шляхи імпорту для нових сторонніх
плагінів.

`openclaw/plugin-sdk/discord` і `openclaw/plugin-sdk/telegram-account` також
збережені як застарілі compatibility facades для відстеженого використання власником. Не
копіюйте ці шляхи імпорту в нові плагіни; натомість використовуйте інжектовані runtime-хелпери та
універсальні підшляхи SDK каналів.
</Warning>

## Довідник підшляхів

SDK плагінів надається як набір вузьких підшляхів, згрупованих за областями (entry плагіна,
канал, провайдер, автентифікація, runtime, capability, memory та зарезервовані
хелпери вбудованих плагінів). Повний каталог — згрупований і з посиланнями — дивіться в
[підшляхах SDK плагінів](/uk/plugins/sdk-subpaths).

Інвентар entrypoint компілятора міститься в
`scripts/lib/plugin-sdk-entrypoints.json`; експорти пакета генеруються з
публічної підмножини після вилучення локальних для репозиторію тестових/внутрішніх підшляхів, перелічених у
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Запустіть
`pnpm plugin-sdk:surface`, щоб перевірити кількість публічних експортів. Застарілі публічні
підшляхи, які достатньо старі й не використовуються production-кодом вбудованих розширень,
відстежуються в `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; широкі
застарілі barrel-файли реекспорту відстежуються в
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API реєстрації

Callback `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація capability

| Метод                                            | Що він реєструє                         |
| ------------------------------------------------ | --------------------------------------- |
| `api.registerProvider(...)`                      | Текстове виведення (LLM)                |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий executor агента |
| `api.registerCliBackend(...)`                    | Локальний бекенд виведення CLI          |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями             |
| `api.registerEmbeddingProvider(...)`             | Багаторазовий провайдер векторних embedding |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT             |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі  |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео            |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                     |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                        |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                         |
| `api.registerWebFetchProvider(...)`              | Провайдер web fetch / scrape            |
| `api.registerWebSearchProvider(...)`             | Вебпошук                                |

Провайдери embedding, зареєстровані через `api.registerEmbeddingProvider(...)`, також мають
бути перелічені в `contracts.embeddingProviders` у маніфесті плагіна. Це
універсальна поверхня embedding для багаторазової генерації векторів. Пошук у memory
може споживати цю універсальну поверхню провайдера. Старіший
`api.registerMemoryEmbeddingProvider(...)` і
`contracts.memoryEmbeddingProviders` seam є застарілою сумісністю, поки
наявні специфічні для memory провайдери мігрують.

Специфічні для memory провайдери, які все ще надають runtime `batchEmbed(...)`, залишаються на
наявному контракті batch-обробки на файл, якщо їхній runtime явно не встановлює
`sourceWideBatchEmbed: true`. Ця opt-in опція дає memory host змогу надсилати chunks з
кількох змінених memory-файлів і ввімкнених джерел в одному виклику `batchEmbed(...)` до
batch-лімітів host. Batch-адаптери, які завантажують JSONL request-файли, також мають
розділяти provider jobs до досягнення обмеження розміру завантаження, а також обмеження
кількості запитів. Провайдер має повернути один embedding на кожен input chunk у тому самому порядку, що й
`batch.chunks`; не вказуйте прапорець, коли провайдер очікує file-local batches або
не може зберегти порядок input у більшому source-wide job.

### Інструменти та команди

Використовуйте [`defineToolPlugin`](/uk/plugins/tool-plugins) для простих плагінів лише з інструментами
з фіксованими назвами інструментів. Використовуйте `api.registerTool(...)` напряму для змішаних плагінів
або повністю динамічної реєстрації інструментів.

| Метод                           | Що він реєструє                              |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (оминає LLM)           |

Команди плагінів можуть встановлювати `agentPromptGuidance`, коли агенту потрібна коротка,
належна команді підказка маршрутизації. Тримайте цей текст про саму команду; не додавайте
політику, специфічну для провайдера або плагіна, у core prompt builders.

Guidance entries можуть бути застарілими рядками, які застосовуються до кожної prompt surface, або
структурованими entries:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Структуровані `surfaces` можуть містити `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` або `subagent`. `pi_main` залишається застарілим alias
для `openclaw_main`. Пропускайте `surfaces` для навмисної guidance на всіх surfaces. Не
передавайте порожній масив `surfaces`; його буде відхилено, щоб випадкова втрата scope не
стала глобальним prompt-текстом.

Native Codex app-server developer instructions суворіші за інші prompt
surfaces: лише guidance, явно scoped до `codex_app_server`, просувається у
цей lane з вищим пріоритетом. Застаріла string guidance і unscoped structured
guidance залишаються доступними для prompt surfaces, що не належать до Codex, для сумісності.

### Інфраструктура

| Метод                                          | Що він реєструє                         |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event hook                              |
| `api.registerHttpRoute(params)`                | HTTP endpoint Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | RPC method Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Local Gateway discovery advertiser      |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                          |
| `api.registerNodeCliFeature(registrar, opts?)` | Feature CLI Node під `openclaw nodes`   |
| `api.registerService(service)`                 | Фоновий сервіс                          |
| `api.registerInteractiveHandler(registration)` | Інтерактивний handler                   |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime middleware результатів інструментів |
| `api.registerMemoryPromptSupplement(builder)`  | Додаткова prompt section поряд із memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Додатковий corpus для пошуку/читання memory |

### Host hooks для плагінів workflow

Host hooks — це seams SDK для плагінів, яким потрібно брати участь у життєвому циклі host,
а не лише додавати провайдер, канал або інструмент. Це
універсальні контракти; Plan Mode може їх використовувати, але так само можуть approval workflows,
workspace policy gates, background monitors, setup wizards і UI companion
plugins.

| Метод                                                                               | Контракт, за який він відповідає                                                                                                                            |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Стан сеансу, яким володіє Plugin, сумісний із JSON і проєктований через сеанси Gateway                                                                      |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Довговічний контекст із гарантією «рівно один раз», ін’єктований у наступний хід агента для одного сеансу                                                   |
| `api.registerTrustedToolPolicy(...)`                                                 | Довірена політика інструментів перед Plugin, обмежена маніфестом, яка може блокувати або переписувати параметри інструмента                                |
| `api.registerToolMetadata(...)`                                                      | Метадані відображення каталогу інструментів без зміни реалізації інструмента                                                                                |
| `api.registerCommand(...)`                                                           | Команди Plugin з областю дії; результати команд можуть задавати `continueAgent: true` або `suppressReply: true`; нативні команди Discord підтримують `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Дескриптори внесків інтерфейсу керування для поверхонь сеансу, інструмента, запуску або налаштувань                                                        |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Зворотні виклики очищення для runtime-ресурсів, якими володіє Plugin, у шляхах скидання, видалення або перезавантаження                                   |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Санітизовані підписки на події для стану workflow і моніторів                                                                                              |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Чернетковий стан Plugin для окремого запуску, який очищається під час термінального життєвого циклу запуску                                                |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Метадані очищення для завдань планувальника, якими володіє Plugin; не планує роботу й не створює записи завдань                                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Доставка файлових вкладень лише для вбудованих Plugin через хост до активного маршруту прямого вихідного сеансу                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Заплановані ходи сеансу на базі Cron лише для вбудованих Plugin, а також очищення за тегами                                                                |
| `api.session.controls.registerSessionAction(...)`                                    | Типізовані дії сеансу, які клієнти можуть надсилати через Gateway                                                                                          |

Використовуйте згруповані простори назв для нового коду Plugin:

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

Еквівалентні плоскі методи залишаються доступними як застарілі псевдоніми
сумісності для наявних Plugin. Не додавайте новий код Plugin, який напряму
викликає `api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` або
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` — це зручна обгортка з областю дії сеансу над
планувальником Cron у Gateway. Cron відповідає за час виконання й створює
фоновий запис завдання, коли хід запускається; Plugin SDK лише обмежує цільовий
сеанс, іменування, яким володіє Plugin, та очищення. Використовуйте
`api.runtime.tasks.managedFlows` усередині запланованого ходу, коли сама робота
потребує довговічного багатокрокового стану Task Flow.

Контракти навмисно розділяють повноваження:

- Зовнішні Plugin можуть володіти розширеннями сеансу, дескрипторами UI, командами, метаданими інструментів, ін’єкціями наступного ходу та звичайними хуками.
- Довірені політики інструментів виконуються перед звичайними хуками `before_tool_call` і є довіреними хостом. Вбудовані політики виконуються першими; політики встановлених Plugin потребують явного ввімкнення та їхніх локальних ідентифікаторів у `contracts.trustedToolPolicies`, і виконуються далі в порядку завантаження Plugin. Ідентифікатори політик обмежені Plugin, який їх реєструє.
- Зарезервоване володіння командами доступне лише для вбудованих Plugin. Зовнішні Plugin мають використовувати власні назви команд або псевдоніми.
- `allowPromptInjection=false` вимикає хуки, що змінюють промпт, зокрема `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`, поля промпта зі застарілого `before_agent_start` і `enqueueNextTurnInjection`.

Приклади споживачів не з Plan:

| Архетип Plugin              | Використані хуки                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Workflow затвердження       | Розширення сеансу, продовження команди, ін’єкція наступного ходу, дескриптор UI                                                      |
| Шлюз політики бюджету/робочої області | Довірена політика інструментів, метадані інструментів, проєкція сеансу                                                               |
| Фоновий монітор життєвого циклу | Очищення життєвого циклу runtime, підписка на події агента, володіння/очищення планувальника сеансу, внесок у промпт Heartbeat, дескриптор UI |
| Майстер налаштування або onboarding | Розширення сеансу, команди з областю дії, дескриптор інтерфейсу керування                                                           |

<Note>
  Зарезервовані основні простори назв адміністратора (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо Plugin намагається призначити
  вужчу область дії методу Gateway. Надавайте перевагу префіксам, специфічним для Plugin, для
  методів, якими володіє Plugin.
</Note>

<Accordion title="When to use tool-result middleware">
  Вбудовані Plugin і явно ввімкнені встановлені Plugin із відповідними
  контрактами маніфесту можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
  їм потрібно переписати результат інструмента після виконання й до того, як runtime
  передасть цей результат назад у модель. Це довірена нейтральна до runtime
  точка інтеграції для асинхронних редукторів виводу, таких як tokenjuice.

Plugin мають оголошувати `contracts.agentToolResultMiddleware` для кожного цільового
runtime, наприклад `["openclaw", "codex"]`. Встановлені Plugin без цього
контракту або без явного ввімкнення не можуть реєструвати це middleware; залишайте
звичайні хуки Plugin OpenClaw для роботи, якій не потрібен таймінг результату
інструмента перед моделлю. Старий шлях реєстрації фабрики розширень лише для
вбудованого runner було вилучено.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дає Plugin змогу оголошувати активний
Gateway у локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw викликає
сервіс під час запуску Gateway, коли локальне виявлення ввімкнене, передає
поточні порти Gateway і несекретні підказкові дані TXT, а також викликає повернений
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

Plugin виявлення Gateway не повинні розглядати оголошені значення TXT як секрети або
автентифікацію. Виявлення — це підказка маршрутизації; автентифікація Gateway і
пінінг TLS усе ще відповідають за довіру.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих команд:

- `commands`: явні назви команд, якими володіє реєстратор
- `descriptors`: дескриптори команд часу парсингу, які використовуються для довідки CLI,
  маршрутизації та ледачої реєстрації CLI Plugin
- `parentPath`: необов’язковий шлях батьківської команди для вкладених груп команд, як-от
  `["nodes"]`

Для функцій парних вузлів надавайте перевагу
`api.registerNodeCliFeature(registrar, opts?)`. Це невелика обгортка навколо
`api.registerCli(..., { parentPath: ["nodes"] })`, яка робить команди на кшталт
`openclaw nodes canvas` явними функціями вузлів, якими володіє Plugin.

Якщо ви хочете, щоб команда Plugin залишалася ледачо завантажуваною у звичайному
кореневому шляху CLI, надайте `descriptors`, які покривають кожен корінь команди
верхнього рівня, відкритий цим реєстратором.

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

Використовуйте лише `commands`, коли вам не потрібна ледача реєстрація кореневого CLI.
Цей eager-шлях сумісності залишається підтримуваним, але він не встановлює
placeholder-и на основі дескрипторів для ледачого завантаження під час парсингу.

### Реєстрація бекенду CLI

`api.registerCliBackend(...)` дає Plugin змогу володіти типовою конфігурацією для локального
бекенду AI CLI, такого як `claude-cli` або `my-cli`.

- Backend `id` стає префіксом провайдера в посиланнях на моделі, як-от `my-cli/gpt-5`.
- Backend `config` використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все ще має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  типового значення plugin перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписування для сумісності після об’єднання
  (наприклад, нормалізації старих форм прапорців).
- Використовуйте `resolveExecutionArgs` для переписування argv у межах запиту, що належить до
  діалекту CLI, наприклад зіставлення рівнів мислення OpenClaw із нативним прапорцем effort.
  Хук отримує `ctx.executionMode`; використовуйте `"side-question"`, щоб додати
  нативні для backend прапорці ізоляції для ефемерних викликів `/btw`. Якщо ці прапорці
  надійно вимикають нативні інструменти для CLI, який інакше завжди ввімкнений, також оголосіть
  `sideQuestionToolMode: "disabled"`.

Повний посібник з авторства дивіться в
[CLI backend plugins](/uk/plugins/cli-backend-plugins).

### Ексклюзивні слоти

| Метод                                      | Що він реєструє                                                                                                                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Рушій контексту (одночасно активний лише один). Lifecycle callback-и отримують `runtimeSettings`, коли хост може надати діагностику моделі/провайдера/режиму; старі strict-рушії повторюються без цього ключа. |
| `api.registerMemoryCapability(capability)` | Уніфікована можливість пам’яті                                                                                                                                                                                      |
| `api.registerMemoryPromptSection(builder)` | Побудовник розділу prompt пам’яті                                                                                                                                                                                   |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану flush пам’яті                                                                                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`       | Runtime-адаптер пам’яті                                                                                                                                                                                            |

### Застарілі адаптери embedding пам’яті

| Метод                                          | Що він реєструє                              |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding пам’яті для активного plugin |

- `registerMemoryCapability` є бажаним ексклюзивним API для memory-plugin.
- `registerMemoryCapability` також може надавати `publicArtifacts.listArtifacts(...)`,
  щоб companion plugins могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core` замість доступу до приватної структури
  конкретного memory plugin.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` є legacy-compatible ексклюзивними API для memory-plugin.
- `MemoryFlushPlan.model` може закріпити flush-turn за точним посиланням
  `provider/model`, наприклад `ollama/qwen3:8b`, без успадкування активного
  ланцюжка fallback.
- `registerMemoryEmbeddingProvider` застарів. Нові провайдери embedding
  мають використовувати `api.registerEmbeddingProvider(...)` і
  `contracts.embeddingProviders`.
- Наявні специфічні для пам’яті провайдери продовжують працювати протягом
  вікна міграції, але інспекція plugin позначає це як compatibility debt для
  non-bundled plugins.

### Події та життєвий цикл

| Метод                                        | Що він робить                         |
| -------------------------------------------- | ------------------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований lifecycle hook            |
| `api.onConversationBindingResolved(handler)` | Callback прив’язки розмови            |

Дивіться [хуки Plugin](/uk/plugins/hooks) для прикладів, поширених назв хуків і
семантики guard.

### Семантика рішень хуків

`before_install` є lifecycle hook runtime plugin, а не поверхнею політики
встановлення оператора. Використовуйте `security.installPolicy`, коли рішення
allow/block має охоплювати шляхи встановлення або оновлення через CLI і Gateway.

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановить його, handler-и з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як override.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановить його, handler-и з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як override.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який handler приймає dispatch, handler-и з нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який handler встановить його, handler-и з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` трактується як відсутність рішення (так само, як пропуск `cancel`), а не як override.
- `message_received`: використовуйте типізоване поле `threadId`, коли потрібна маршрутизація вхідного треду/теми. Залишайте `metadata` для специфічних для каналу додаткових даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічного для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить Gateway, замість покладання на внутрішні хуки `gateway:startup`.
- `cron_changed`: спостерігайте за змінами життєвого циклу cron, що належить Gateway. Використовуйте `event.job?.state?.nextRunAtMs` і `ctx.getCron?.()` під час синхронізації зовнішніх wake schedulers, і залишайте OpenClaw джерелом істини для перевірок строків виконання та виконання.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                                 |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | ID Plugin                                                                                            |
| `api.name`               | `string`                  | Відображувана назва                                                                                  |
| `api.version`            | `string?`                 | Версія Plugin (необов’язково)                                                                        |
| `api.description`        | `string?`                 | Опис Plugin (необов’язково)                                                                          |
| `api.source`             | `string`                  | Шлях до джерела Plugin                                                                               |
| `api.rootDir`            | `string?`                 | Кореневий каталог Plugin (необов’язково)                                                             |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний in-memory runtime snapshot, коли доступний)                   |
| `api.pluginConfig`       | `Record<string, unknown>` | Специфічна для Plugin конфігурація з `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Runtime helpers](/uk/plugins/sdk-runtime)                                                              |
| `api.logger`             | `PluginLogger`            | Scoped logger (`debug`, `info`, `warn`, `error`)                                                     |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — легке вікно startup/setup перед повним entry       |
| `api.resolvePath(input)` | `(string) => string`      | Розв’язує шлях відносно кореня Plugin                                                                |

## Конвенція внутрішніх модулів

У своєму plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  з production code. Маршрутизуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK є лише зовнішнім контрактом.
</Warning>

Публічні поверхні bundled plugin, завантажені через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` і подібні публічні entry-файли), віддають перевагу
активному runtime config snapshot, коли OpenClaw уже запущений. Якщо runtime
snapshot ще не існує, вони повертаються до розв’язного файлу конфігурації на диску.
Facade-и packaged bundled plugin мають завантажуватися через plugin facade loaders
OpenClaw; прямі імпорти з `dist/extensions/...` обходять manifest і runtime sidecar
checks, які packaged installs використовують для коду, що належить plugin.

Provider plugins можуть надавати вузький локальний для plugin contract barrel, коли
helper навмисно специфічний для провайдера і ще не належить до generic SDK subpath.
Bundled приклади:

- **Anthropic**: публічний seam `api.ts` / `contract-api.ts` для Claude
  beta-header і stream helper-ів `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує provider builders,
  default-model helpers і realtime provider builders.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує provider builder
  плюс onboarding/config helpers.

<Warning>
  Production code extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо helper справді спільний, підніміть його до нейтрального SDK subpath,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або інша
  capability-oriented surface, замість зв’язування двох plugins між собою.
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
    Пакування, manifests і config schemas.
  </Card>
  <Card title="Testing" icon="vial" href="/uk/plugins/sdk-testing">
    Тестові утиліти та правила lint.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/uk/plugins/sdk-migration">
    Міграція із застарілих поверхонь.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/uk/plugins/architecture">
    Глибока архітектура та модель можливостей.
  </Card>
</CardGroup>
