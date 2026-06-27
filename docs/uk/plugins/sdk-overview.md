---
read_when:
    - Потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібна довідка щодо всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: Plugin SDK overview
summary: Карта імпорту, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-06-27T18:04:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69321b569f7609c6ee9312f0234ce94f274bf03822df61988f34e1effb55339e
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK плагінів є типізованим контрактом між плагінами та ядром. Ця сторінка є
довідником щодо того, **що імпортувати** і **що можна реєструвати**.

<Note>
  Ця сторінка призначена для авторів плагінів, які використовують `openclaw/plugin-sdk/*` всередині
  OpenClaw. Для зовнішніх застосунків, скриптів, панелей керування, CI-завдань та розширень IDE,
  які хочуть запускати агентів через Gateway, натомість використовуйте
  [інтеграції Gateway для зовнішніх застосунків](/uk/gateway/external-apps).
</Note>

<Tip>
Шукаєте натомість практичний посібник? Почніть із [створення плагінів](/uk/plugins/building-plugins), використовуйте [плагіни каналів](/uk/plugins/sdk-channel-plugins) для плагінів каналів, [плагіни провайдерів](/uk/plugins/sdk-provider-plugins) для плагінів провайдерів, [плагіни бекендів CLI](/uk/plugins/cli-backend-plugins) для локальних AI CLI-бекендів і [хуки плагінів](/uk/plugins/hooks) для плагінів інструментів або хуків життєвого циклу.
</Tip>

## Угода про імпорт

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це підтримує швидкий запуск і
запобігає проблемам із циклічними залежностями. Для допоміжних засобів entry/build,
специфічних для каналів, надавайте перевагу `openclaw/plugin-sdk/channel-core`; залишайте
`openclaw/plugin-sdk/core` для ширшої парасолькової поверхні та спільних допоміжних засобів,
таких як `buildChannelConfigSchema`.

Для конфігурації каналу публікуйте JSON Schema, якою володіє канал, через
`openclaw.plugin.json#channelConfigs`. Підшлях `plugin-sdk/channel-config-schema`
призначений для спільних примітивів схем і загального конструктора. Вбудовані
плагіни OpenClaw використовують `plugin-sdk/bundled-channel-config-schema` для збережених
схем вбудованих каналів. Застарілі експорти сумісності залишаються в
`plugin-sdk/channel-config-schema-legacy`; жоден із підшляхів вбудованих схем не є
шаблоном для нових плагінів.

<Warning>
  Не імпортуйте зручні шви з брендуванням провайдера або каналу (наприклад,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані плагіни компонують загальні підшляхи SDK у власних барелях `api.ts` /
  `runtime-api.ts`; споживачі ядра мають або використовувати ці локальні для плагіна
  барелі, або додавати вузький загальний контракт SDK, коли потреба справді є
  міжканальною.

Невеликий набір допоміжних швів вбудованих плагінів усе ще з’являється у згенерованій мапі
експортів, коли для них відстежено використання власником. Вони існують лише для
супроводу вбудованих плагінів і не рекомендовані як шляхи імпорту для нових сторонніх
плагінів.

`openclaw/plugin-sdk/discord` і `openclaw/plugin-sdk/telegram-account` також
збережені як застарілі фасади сумісності для відстеженого використання власником. Не
копіюйте ці шляхи імпорту в нові плагіни; натомість використовуйте ін’єктовані runtime-допоміжні засоби
та загальні підшляхи SDK каналів.
</Warning>

## Довідник підшляхів

SDK плагінів надається як набір вузьких підшляхів, згрупованих за областями (entry
плагіна, канал, провайдер, auth, runtime, capability, пам’ять і зарезервовані
допоміжні засоби вбудованих плагінів). Повний каталог — згрупований і з посиланнями — див.
у [підшляхах Plugin SDK](/uk/plugins/sdk-subpaths).

Інвентар entrypoint компілятора міститься в
`scripts/lib/plugin-sdk-entrypoints.json`; експорти пакета генеруються з
публічної підмножини після вилучення repo-local тестових/внутрішніх підшляхів, перелічених у
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Запустіть
`pnpm plugin-sdk:surface`, щоб перевірити кількість публічних експортів. Застарілі публічні
підшляхи, які достатньо старі та не використовуються production-кодом вбудованих розширень,
відстежуються в `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; широкі
застарілі барелі реекспорту відстежуються в
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API реєстрації

Callback `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація capability

| Метод                                            | Що він реєструє                         |
| ------------------------------------------------ | --------------------------------------- |
| `api.registerProvider(...)`                      | Текстове виведення (LLM)                |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агентів |
| `api.registerCliBackend(...)`                    | Локальний CLI-бекенд виведення          |
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

Провайдери embedding, зареєстровані через `api.registerEmbeddingProvider(...)`, також
мають бути перелічені в `contracts.embeddingProviders` у маніфесті плагіна. Це
загальна поверхня embedding для багаторазової генерації векторів. Пошук у пам’яті
може споживати цю загальну поверхню провайдера. Старіший шов
`api.registerMemoryEmbeddingProvider(...)` і
`contracts.memoryEmbeddingProviders` є застарілою сумісністю, поки
існуючі специфічні для пам’яті провайдери мігрують.

Специфічні для пам’яті провайдери, які досі надають runtime `batchEmbed(...)`, залишаються на
існуючому контракті пакетної обробки для кожного файла, якщо їхній runtime явно не встановлює
`sourceWideBatchEmbed: true`. Цей opt-in дає хосту пам’яті змогу надсилати фрагменти з
кількох змінених файлів пам’яті та ввімкнених джерел в одному виклику `batchEmbed(...)`
до пакетних лімітів хоста. Пакетні адаптери, які завантажують файли запитів JSONL, також мають
розділяти завдання провайдера перед досягненням ліміту розміру завантаження та ліміту кількості
запитів. Провайдер має повертати один embedding на кожен вхідний фрагмент у тому самому порядку,
що й `batch.chunks`; пропускайте прапорець, коли провайдер очікує локальні для файла пакети або
не може зберегти порядок входів у більшому завданні на рівні джерела.

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
політики, специфічної для провайдера або плагіна, до побудовників prompt ядра.

Записи guidance можуть бути legacy-рядками, які застосовуються до кожної поверхні prompt, або
структурованими записами:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Структуровані `surfaces` можуть містити `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` або `subagent`. `pi_main` залишається застарілим alias
для `openclaw_main`. Пропускайте `surfaces` для навмисного guidance на всіх поверхнях. Не
передавайте порожній масив `surfaces`; він відхиляється, щоб випадкова втрата області дії не
стала глобальним текстом prompt.

Нативні інструкції розробника app-server Codex суворіші за інші поверхні prompt:
лише guidance, явно обмежений `codex_app_server`, просувається в цю смугу з вищим
пріоритетом. Legacy-рядки guidance і не обмежений областю структурований guidance
залишаються доступними для prompt-поверхонь не-Codex для сумісності.

### Інфраструктура

| Метод                                          | Що він реєструє                         |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Хук події                               |
| `api.registerHttpRoute(params)`                | HTTP-endpoint Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод Gateway                       |
| `api.registerGatewayDiscoveryService(service)` | Рекламодавець виявлення локального Gateway |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                          |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI функції Node під `openclaw nodes`   |
| `api.registerService(service)`                 | Фоновий сервіс                          |
| `api.registerInteractiveHandler(registration)` | Інтерактивний обробник                  |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime middleware результатів інструментів |
| `api.registerMemoryPromptSupplement(builder)`  | Додатковий розділ prompt поряд із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`  | Додатковий корпус пошуку/читання пам’яті |

### Хостові хуки для workflow-плагінів

Хостові хуки — це шви SDK для плагінів, яким потрібно брати участь у життєвому циклі
хоста, а не лише додавати провайдера, канал або інструмент. Це загальні контракти;
режим планування може їх використовувати, але так само можуть workflow затвердження,
policy gates робочої області, фонові монітори, майстри налаштування та супровідні
UI-плагіни.

| Метод                                                                               | Контракт, яким він володіє                                                                                                                  |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Стан сесії, яким володіє Plugin, JSON-сумісний і проєктований через сесії Gateway                                                    |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Стійкий контекст з гарантією рівно одного виконання, що вводиться в наступний хід агента для однієї сесії                                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | Довірена політика інструментів перед Plugin, обмежена маніфестом, яка може блокувати або переписувати параметри інструмента                                               |
| `api.registerToolMetadata(...)`                                                      | Метадані відображення каталогу інструментів без зміни реалізації інструмента                                                            |
| `api.registerCommand(...)`                                                           | Команди Plugin з обмеженою областю дії; результати команд можуть задавати `continueAgent: true`; нативні команди Discord підтримують `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Дескриптори внесків інтерфейсу керування для поверхонь сесії, інструмента, запуску або налаштувань                                                  |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Зворотні виклики очищення для runtime-ресурсів, якими володіє Plugin, на шляхах скидання/видалення/перезавантаження                                                 |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Очищені підписки на події для стану workflow та моніторів                                                                     |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Тимчасовий стан Plugin для кожного запуску, що очищується в життєвому циклі термінального запуску                                                                    |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Метадані очищення для завдань планувальника, якими володіє Plugin; не планує роботу й не створює записи завдань                                   |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Доставка файлових вкладень через хост лише для вбудованих Plugin до активного маршруту прямої вихідної сесії                                   |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Заплановані ходи сесії на базі Cron лише для вбудованих Plugin, а також очищення за тегами                                                           |
| `api.session.controls.registerSessionAction(...)`                                    | Типізовані дії сесії, які клієнти можуть диспетчеризувати через Gateway                                                                    |

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

Еквівалентні пласкі методи залишаються доступними як застарілі сумісні
псевдоніми для наявних Plugin. Не додавайте новий код Plugin, який напряму
викликає `api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` або
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` — це зручна обгортка з областю дії сесії над
планувальником Cron у Gateway. Cron володіє таймінгом і створює фоновий запис
завдання, коли виконується хід; Plugin SDK лише обмежує цільову сесію, іменування,
яким володіє Plugin, та очищення. Використовуйте `api.runtime.tasks.managedFlows`
усередині запланованого ходу, коли сама робота потребує стійкого багатоетапного
стану Task Flow.

Контракти навмисно розділяють повноваження:

- Зовнішні Plugin можуть володіти розширеннями сесій, дескрипторами інтерфейсу,
  командами, метаданими інструментів, інʼєкціями наступного ходу та звичайними хуками.
- Довірені політики інструментів виконуються перед звичайними хуками `before_tool_call`
  і є довіреними для хоста. Вбудовані політики виконуються першими; політики
  встановлених Plugin потребують явного ввімкнення разом зі своїми локальними id у
  `contracts.trustedToolPolicies` і виконуються далі в порядку завантаження Plugin. Id політик
  обмежені Plugin, який їх реєструє.
- Зарезервоване володіння командами доступне лише для вбудованих Plugin. Зовнішнім Plugin слід
  використовувати власні назви команд або псевдоніми.
- `allowPromptInjection=false` вимикає хуки, що змінюють prompt, зокрема
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  поля prompt із застарілого `before_agent_start` і
  `enqueueNextTurnInjection`.

Приклади споживачів не з Plan:

| Архетип Plugin             | Використані хуки                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow затвердження            | Розширення сесії, продовження команди, інʼєкція наступного ходу, дескриптор інтерфейсу                                                            |
| Шлюз політики бюджету/робочого простору | Довірена політика інструментів, метадані інструментів, проєкція сесії                                                                                 |
| Фоновий монітор життєвого циклу | Очищення життєвого циклу runtime, підписка на події агента, володіння/очищення планувальника сесій, внесок Heartbeat prompt, дескриптор інтерфейсу |
| Майстер налаштування або onboarding   | Розширення сесії, команди з обмеженою областю дії, дескриптор інтерфейсу керування                                                                              |

<Note>
  Зарезервовані основні адміністративні простори назв (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо Plugin намагається призначити
  вужчу область дії методу Gateway. Надавайте перевагу префіксам, специфічним для Plugin, для
  методів, якими володіє Plugin.
</Note>

<Accordion title="When to use tool-result middleware">
  Вбудовані Plugin і явно ввімкнені встановлені Plugin з відповідними
  контрактами маніфесту можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
  їм потрібно переписати результат інструмента після виконання і до того, як runtime
  передасть цей результат назад у модель. Це довірений runtime-нейтральний
  шов для асинхронних редукторів виводу, як-от tokenjuice.

Plugin мають оголошувати `contracts.agentToolResultMiddleware` для кожного цільового
runtime, наприклад `["openclaw", "codex"]`. Установлені Plugin без цього
контракту або без явного ввімкнення не можуть реєструвати цей middleware; залишайте
звичайні хуки Plugin OpenClaw для роботи, якій не потрібен таймінг результату
інструмента перед моделлю. Старий шлях реєстрації фабрики розширення лише для
вбудованого runner видалено.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дає Plugin змогу рекламувати активний
Gateway на локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw викликає
сервіс під час запуску Gateway, коли ввімкнено локальне виявлення, передає
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

Plugin виявлення Gateway не повинні трактувати рекламовані значення TXT як секрети або
автентифікацію. Виявлення — це підказка маршрутизації; автентифікація Gateway і TLS pinning
далі володіють довірою.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих команд:

- `commands`: явні назви команд, якими володіє реєстратор
- `descriptors`: дескриптори команд під час розбору, що використовуються для довідки CLI,
  маршрутизації та лінивої реєстрації CLI Plugin
- `parentPath`: необовʼязковий шлях батьківської команди для вкладених груп команд, наприклад
  `["nodes"]`

Для функцій paired-node надавайте перевагу
`api.registerNodeCliFeature(registrar, opts?)`. Це невелика обгортка навколо
`api.registerCli(..., { parentPath: ["nodes"] })`, яка робить команди на кшталт
`openclaw nodes canvas` явними функціями node, якими володіє Plugin.

Якщо ви хочете, щоб команда Plugin залишалася ліниво завантажуваною у звичайному
кореневому шляху CLI, надайте `descriptors`, які охоплюють кожен корінь команди
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

Вкладені команди отримують розвʼязану батьківську команду як `program`:

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

Використовуйте `commands` окремо лише тоді, коли вам не потрібна лінива коренева
реєстрація CLI. Цей eager-сумісний шлях залишається підтримуваним, але він не встановлює
placeholder-и на основі дескрипторів для лінивого завантаження під час розбору.

### Реєстрація backend CLI

`api.registerCliBackend(...)` дає Plugin змогу володіти типовою конфігурацією для локального
backend ШІ CLI, такого як `claude-cli` або `my-cli`.

- `id` backend стає префіксом provider у посиланнях на модель на кшталт `my-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw обʼєднує `agents.defaults.cliBackends.<id>` поверх
  типового значення Plugin перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує сумісних переписувань після обʼєднання
  (наприклад, нормалізації старих форм прапорців).
- Використовуйте `resolveExecutionArgs` для переписувань argv в області запиту, що належать до
  діалекту CLI, наприклад відображення рівнів мислення OpenClaw на нативний прапорець
  effort. Хук отримує `ctx.executionMode`; використовуйте `"side-question"`, щоб додати
  нативні для backend прапорці ізоляції для ефемерних викликів `/btw`. Якщо ці прапорці
  надійно вимикають нативні інструменти для CLI, який інакше завжди ввімкнений, також оголосіть
  `sideQuestionToolMode: "disabled"`.

Повний посібник з авторингу дивіться в
[Plugin-и backend CLI](/uk/plugins/cli-backend-plugins).

### Ексклюзивні слоти

| Метод                                      | Що він реєструє                                                                                                                                                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Рушій контексту (одночасно активний лише один). Зворотні виклики життєвого циклу отримують `runtimeSettings`, коли хост може надати діагностику моделі/провайдера/режиму; старі суворі рушії повторюються без цього ключа. |
| `api.registerMemoryCapability(capability)` | Уніфікована можливість пам’яті                                                                                                                                                                                    |
| `api.registerMemoryPromptSection(builder)` | Конструктор секції промпта пам’яті                                                                                                                                                                                |
| `api.registerMemoryFlushPlan(resolver)`    | Резолвер плану скидання пам’яті                                                                                                                                                                                   |
| `api.registerMemoryRuntime(runtime)`       | Адаптер середовища виконання пам’яті                                                                                                                                                                              |

### Застарілі адаптери вбудовування пам’яті

| Метод                                          | Що він реєструє                              |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер вбудовування пам’яті для активного Plugin |

- `registerMemoryCapability` є пріоритетним ексклюзивним API Plugin пам’яті.
- `registerMemoryCapability` також може надавати `publicArtifacts.listArtifacts(...)`,
  щоб супутні Plugin могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core` замість звернення до приватної структури
  конкретного Plugin пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` є ексклюзивними API Plugin пам’яті, сумісними зі спадковими версіями.
- `MemoryFlushPlan.model` може закріпити хід скидання за точним посиланням
  `provider/model`, наприклад `ollama/qwen3:8b`, без успадкування активного
  ланцюга резервного вибору.
- `registerMemoryEmbeddingProvider` застарів. Нові провайдери вбудовувань
  мають використовувати `api.registerEmbeddingProvider(...)` і
  `contracts.embeddingProviders`.
- Наявні провайдери, специфічні для пам’яті, продовжують працювати під час
  міграційного вікна, але інспекція Plugin повідомляє про це як про борг сумісності для
  небандлованих Plugin.

### Події та життєвий цикл

| Метод                                        | Що він робить                    |
| -------------------------------------------- | -------------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу  |
| `api.onConversationBindingResolved(handler)` | Зворотний виклик прив’язки розмови |

Див. [хуки Plugin](/uk/plugins/hooks) для прикладів, поширених назв хуків і
семантики запобіжників.

### Семантика рішень хуків

`before_install` є хуком життєвого циклу середовища виконання Plugin, а не поверхнею
політики встановлення оператора. Використовуйте `security.installPolicy`, коли рішення про дозвіл/блокування має
охоплювати шляхи встановлення або оновлення через CLI і Gateway.

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник заявляє обробку відправлення, обробники з нижчим пріоритетом і типовий шлях відправлення моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` трактується як відсутність рішення (так само, як пропуск `cancel`), а не як перевизначення.
- `message_received`: використовуйте типізоване поле `threadId`, коли потрібна маршрутизація вхідного потоку/теми. Залишайте `metadata` для додаткових даних, специфічних для каналу.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічного для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стартового стану, яким володіє Gateway, замість покладання на внутрішні хуки `gateway:startup`.
- `cron_changed`: спостерігайте за змінами життєвого циклу Cron, яким володіє Gateway. Використовуйте `event.job?.state?.nextRunAtMs` і `ctx.getCron?.()` під час синхронізації зовнішніх планувальників пробудження, а OpenClaw залишайте джерелом істини для перевірок терміну виконання та запуску.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                              |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор Plugin                                                                              |
| `api.name`               | `string`                  | Відображувана назва                                                                               |
| `api.version`            | `string?`                 | Версія Plugin (необов’язково)                                                                     |
| `api.description`        | `string?`                 | Опис Plugin (необов’язково)                                                                       |
| `api.source`             | `string`                  | Шлях до джерела Plugin                                                                            |
| `api.rootDir`            | `string?`                 | Кореневий каталог Plugin (необов’язково)                                                          |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок середовища виконання в пам’яті, коли доступний)     |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація, специфічна для Plugin, з `plugins.entries.<id>.config`                              |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби середовища виконання](/uk/plugins/sdk-runtime)                                     |
| `api.logger`             | `PluginLogger`            | Обмежений за областю логер (`debug`, `info`, `warn`, `error`)                                     |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це легке стартове/налаштувальне вікно перед повним входом |
| `api.resolvePath(input)` | `(string) => string`      | Розв’язати шлях відносно кореня Plugin                                                            |

## Внутрішня конвенція модулів

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
  з виробничого коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK є лише зовнішнім контрактом.
</Warning>

Публічні поверхні бандлованого Plugin, завантаженого через фасад (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` і подібні публічні вхідні файли), віддають перевагу
активному знімку конфігурації середовища виконання, коли OpenClaw уже запущено. Якщо знімка середовища виконання
ще немає, вони повертаються до розв’язаного конфігураційного файла на диску.
Фасади пакетованих бандлованих Plugin мають завантажуватися через завантажувачі фасадів Plugin
OpenClaw; прямі імпорти з `dist/extensions/...` обходять маніфест
і перевірки runtime-sidecar, які пакетовані встановлення використовують для коду, яким володіє Plugin.

Provider Plugin можуть надавати вузький локальний для Plugin barrel контракту, коли
допоміжний засіб навмисно є специфічним для провайдера і ще не належить до загального підшляху SDK.
Бандловані приклади:

- **Anthropic**: публічний шов `api.ts` / `contract-api.ts` для допоміжних засобів потоку
  beta-header Claude і `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує конструктори провайдерів,
  допоміжні засоби моделей за замовчуванням і конструктори провайдерів реального часу.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує конструктор провайдера
  плюс допоміжні засоби onboarding/конфігурації.

<Warning>
  Виробничий код розширення також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді спільний, підніміть його до нейтрального підшляху SDK,
  наприклад `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливості, замість зв’язування двох Plugin між собою.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вхідні точки" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Параметри `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Допоміжні засоби середовища виконання" icon="gears" href="/uk/plugins/sdk-runtime">
    Повна довідка простору імен `api.runtime`.
  </Card>
  <Card title="Налаштування та конфігурація" icon="sliders" href="/uk/plugins/sdk-setup">
    Пакування, маніфести та схеми конфігурації.
  </Card>
  <Card title="Тестування" icon="vial" href="/uk/plugins/sdk-testing">
    Тестові утиліти та правила лінтингу.
  </Card>
  <Card title="Міграція SDK" icon="arrows-turn-right" href="/uk/plugins/sdk-migration">
    Міграція із застарілих поверхонь.
  </Card>
  <Card title="Внутрішня архітектура Plugin" icon="diagram-project" href="/uk/plugins/architecture">
    Глибока архітектура та модель можливостей.
  </Card>
</CardGroup>
