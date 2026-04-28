---
read_when:
    - Вам потрібно знати, з якого підшляху SDK виконувати імпорт
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK overview
summary: Карта імпорту, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-28T01:34:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18899fbe32150e1c1d06656874234333eb46325651f56cdd0641e15e7fc99e02
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK — це типізований контракт між plugins і ядром. Ця сторінка є
довідником щодо **того, що імпортувати** і **що можна зареєструвати**.

<Tip>
  Шукаєте натомість практичний посібник?

- Перший plugin? Почніть із [Створення plugins](/uk/plugins/building-plugins).
- Plugin каналу? Див. [Plugins каналів](/uk/plugins/sdk-channel-plugins).
- Plugin провайдера? Див. [Plugins провайдерів](/uk/plugins/sdk-provider-plugins).
- Plugin інструментів або хуків життєвого циклу? Див. [Хуки Plugin](/uk/plugins/hooks).
  </Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це пришвидшує запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналу
допоміжних засобів entry/build надавайте перевагу `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core`
залишайте для ширшої зонтичної поверхні та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

Для конфігурації каналу публікуйте JSON Schema, що належить каналу, через
`openclaw.plugin.json#channelConfigs`. Підшлях `plugin-sdk/channel-config-schema`
призначений для спільних примітивів схем і узагальненого конструктора. Вбудовані plugins OpenClaw
використовують `plugin-sdk/bundled-channel-config-schema` для збережених
схем bundled-channel. Застарілі сумісні експорти залишаються в
`plugin-sdk/channel-config-schema-legacy`; жоден із підшляхів bundled schema не є
шаблоном для нових plugins.

<Warning>
  Не імпортуйте фірмові зручні шви для provider або channel (наприклад,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані plugins поєднують узагальнені підшляхи SDK у власних barrel-файлах `api.ts` /
  `runtime-api.ts`; споживачам ядра слід або використовувати ці локальні для plugin
  barrel-файли, або додавати вузький узагальнений контракт SDK, коли потреба справді
  є міжканальною.

Невеликий набір допоміжних швів вбудованих plugins (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` та подібні) усе ще з’являється в
згенерованій карті експортів. Вони існують лише для підтримки вбудованих plugins і
не рекомендовані як шляхи імпорту для нових сторонніх plugins.
</Warning>

## Довідник підшляхів

Plugin SDK доступний як набір вузьких підшляхів, згрупованих за областями (plugin
entry, channel, provider, auth, runtime, capability, memory і зарезервовані
допоміжні засоби вбудованих plugins). Повний каталог — згрупований і з посиланнями — див. у
[Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).

Згенерований список із 200+ підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Зворотний виклик `register(api)` отримує об’єкт `OpenClawPluginApi` із такими
методами:

### Реєстрація можливостей

| Метод                                           | Що він реєструє                     |
| ------------------------------------------------ | ----------------------------------- |
| `api.registerProvider(...)`                      | Текстове виведення (LLM)            |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний бекенд виведення CLI      |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями         |
| `api.registerSpeechProvider(...)`                | Синтез мовлення / STT               |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео        |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                 |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                    |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                     |
| `api.registerWebFetchProvider(...)`              | Провайдер веб-отримання / скрапінгу |
| `api.registerWebSearchProvider(...)`             | Вебпошук                            |

### Інструменти та команди

| Метод                          | Що він реєструє                             |
| ------------------------------- | ------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (оминає LLM)          |

Команди plugin можуть задавати `agentPromptGuidance`, коли агенту потрібна коротка
підказка маршрутизації, що належить команді. Зосереджуйте цей текст на самій команді; не додавайте
специфічну для provider або plugin політику до конструкторів підказок ядра.

### Інфраструктура

| Метод                                         | Що він реєструє                       |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Хук події                             |
| `api.registerHttpRoute(params)`                | HTTP-ендпоінт Gateway                 |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод Gateway                     |
| `api.registerGatewayDiscoveryService(service)` | Служба оголошення локального виявлення Gateway |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                        |
| `api.registerService(service)`                 | Фонова служба                         |
| `api.registerInteractiveHandler(registration)` | Інтерактивний обробник                |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware результатів інструментів середовища виконання |
| `api.registerMemoryPromptSupplement(builder)`  | Додатковий розділ підказки, суміжний із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`  | Додатковий корпус пошуку/читання пам’яті |

### Хуки хоста для plugins робочих процесів

Хуки хоста — це шви SDK для plugins, яким потрібно брати участь у життєвому циклі
хоста, а не лише додавати provider, channel або tool. Це
узагальнені контракти; Plan Mode може їх використовувати, але так само можуть і
процеси затвердження, політики робочого простору, фонові монітори, майстри налаштування та plugins-супутники UI.

| Метод                                                                   | Контракт, яким він володіє                                                           |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `api.registerSessionExtension(...)`                                      | Стан сесії, що належить plugin, сумісний із JSON і проєктується через сесії Gateway |
| `api.enqueueNextTurnInjection(...)`                                      | Стійкий контекст рівно-один-раз, ін’єктований у наступний хід агента для однієї сесії |
| `api.registerTrustedToolPolicy(...)`                                     | Політика інструментів bundled/trusted до plugin, яка може блокувати або переписувати параметри інструментів |
| `api.registerToolMetadata(...)`                                          | Метадані відображення каталогу інструментів без зміни реалізації інструмента         |
| `api.registerCommand(...)`                                               | Обмежені plugins команди; результати команд можуть задавати `continueAgent: true`   |
| `api.registerControlUiDescriptor(...)`                                   | Дескриптори внеску в Control UI для поверхонь сесії, інструмента, запуску або налаштувань |
| `api.registerRuntimeLifecycle(...)`                                      | Зворотні виклики очищення для ресурсів середовища виконання, що належать plugin, на шляхах reset/delete/reload |
| `api.registerAgentEventSubscription(...)`                                | Очищені підписки на події для стану робочого процесу та моніторів                    |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Тимчасовий стан plugin на один запуск, який очищається в термінальному життєвому циклі запуску |
| `api.registerSessionSchedulerJob(...)`                                   | Записи завдань планувальника сесій, що належать plugin, із детермінованим очищенням |

Ці контракти навмисно розділяють повноваження:

- Зовнішні plugins можуть володіти розширеннями сесій, дескрипторами UI, командами, метаданими
  інструментів, ін’єкціями наступного ходу та звичайними хуками.
- Політики trusted tool виконуються перед звичайними хуками `before_tool_call` і є
  лише bundled, оскільки вони беруть участь у політиці безпеки хоста.
- Володіння зарезервованими командами доступне лише bundled plugins. Зовнішнім plugins слід використовувати
  власні назви команд або псевдоніми.
- `allowPromptInjection=false` вимикає хуки, що змінюють підказки, зокрема
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  поля підказок із застарілого `before_agent_start`, і
  `enqueueNextTurnInjection`.

Приклади споживачів, не пов’язаних із Plan:

| Архетип plugin             | Використані хуки                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Процес затвердження        | Розширення сесії, продовження команди, ін’єкція наступного ходу, дескриптор UI                                                         |
| Обмеження бюджету/політики робочого простору | Політика trusted tool, метадані інструментів, проєкція сесії                                                          |
| Фоновий монітор життєвого циклу | Очищення життєвого циклу runtime, підписка на події агента, володіння/очищення планувальника сесій, внесок у підказки Heartbeat, дескриптор UI |
| Майстер налаштування або онбордингу | Розширення сесії, обмежені команди, дескриптор Control UI                                                                        |

<Note>
  Зарезервовані простори назв адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
  вужчу область методу gateway. Для методів, що належать plugin,
  надавайте перевагу префіксам, специфічним для plugin.
</Note>

<Accordion title="Коли використовувати middleware результатів інструментів">
  Вбудовані plugins можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
  їм потрібно переписати результат інструмента після виконання і до того, як runtime
  поверне цей результат назад у модель. Це trusted, нейтральний до runtime
  шов для асинхронних редукторів виводу, таких як tokenjuice.

Вбудовані plugins мають оголошувати `contracts.agentToolResultMiddleware` для кожного
цільового runtime, наприклад `["pi", "codex"]`. Зовнішні plugins
не можуть реєструвати це middleware; для роботи, яка не потребує часу виконання результату інструмента до моделі,
використовуйте звичайні хуки Plugin OpenClaw. Старий шлях реєстрації вбудованої
фабрики розширень лише для Pi було видалено.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дає plugin змогу оголошувати активний
Gateway у локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw викликає
службу під час запуску Gateway, коли локальне виявлення увімкнено, передає
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

Plugins виявлення Gateway не повинні розглядати оголошені значення TXT як секрети або
автентифікацію. Виявлення — це підказка для маршрутизації; довірою й надалі керують
автентифікація Gateway і pinning TLS.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє реєстратор
- `descriptors`: дескриптори команд на етапі парсингу, що використовуються для довідки кореневого CLI,
  маршрутизації та лінивої реєстрації CLI plugin

Якщо ви хочете, щоб команда plugin залишалася ліниво завантажуваною у звичайному шляху кореневого CLI,
надайте `descriptors`, які охоплюють кожен корінь команди верхнього рівня, що його
експонує цей реєстратор.

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

Використовуйте лише `commands`, якщо вам не потрібна лінива реєстрація кореневого CLI.
Цей eager-шлях сумісності й далі підтримується, але він не встановлює
плейсхолдери на основі дескрипторів для лінивого завантаження під час парсингу.

### Реєстрація CLI backend

`api.registerCliBackend(...)` дає plugin змогу володіти типовою конфігурацією локального
AI CLI backend, такого як `codex-cli`.

- `id` backend стає префіксом provider у посиланнях на моделі, як-от `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  типового значення plugin перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує сумісних переписувань після злиття
  (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Метод                                     | Що він реєструє                                                                                                                                           |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Рушій контексту (одночасно активний лише один). Зворотний виклик `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг адаптувати доповнення підказок. |
| `api.registerMemoryCapability(capability)` | Єдину можливість пам’яті                                                                                                                                    |
| `api.registerMemoryPromptSection(builder)` | Конструктор розділу підказки пам’яті                                                                                                                        |
| `api.registerMemoryFlushPlan(resolver)`    | Резолвер плану скидання пам’яті                                                                                                                             |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime пам’яті                                                                                                                                     |

### Адаптери ембедингів пам’яті

| Метод                                         | Що він реєструє                              |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер ембедингів пам’яті для активного plugin |

- `registerMemoryCapability` — це бажаний API ексклюзивного plugin пам’яті.
- `registerMemoryCapability` також може експонувати `publicArtifacts.listArtifacts(...)`,
  щоб plugins-супутники могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core` замість доступу до приватного макета
  конкретного plugin пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це сумісні зі спадщиною API ексклюзивного plugin пам’яті.
- `registerMemoryEmbeddingProvider` дозволяє активному plugin пам’яті реєструвати один
  або кілька id адаптерів ембедингів (наприклад, `openai`, `gemini` або користувацький
  id, визначений plugin).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, зіставляється з цими зареєстрованими
  id адаптерів.

### Події та життєвий цикл

| Метод                                       | Що він робить                  |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Зворотний виклик прив’язки розмови |

Приклади, поширені назви хуків і семантику guard див. у [Хуки Plugin](/uk/plugins/hooks).

### Семантика рішень хуків

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник бере dispatch на себе, обробники з нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` розглядається як відсутність рішення (так само, як пропуск `cancel`), а не як перевизначення.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна вхідна маршрутизація thread/topic. `metadata` залишайте для специфічних для каналу додаткових даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічного для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить gateway, замість покладання на внутрішні хуки `gateway:startup`.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                           |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id plugin                                                                                      |
| `api.name`               | `string`                  | Назва для відображення                                                                          |
| `api.version`            | `string?`                 | Версія plugin (необов’язково)                                                                   |
| `api.description`        | `string?`                 | Опис plugin (необов’язково)                                                                     |
| `api.source`             | `string`                  | Шлях до джерела plugin                                                                          |
| `api.rootDir`            | `string?`                 | Кореневий каталог plugin (необов’язково)                                                        |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок runtime у пам’яті, якщо доступний)              |
| `api.pluginConfig`       | `Record<string, unknown>` | Специфічна для plugin конфігурація з `plugins.entries.<id>.config`                             |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                                |
| `api.logger`             | `PluginLogger`            | Логер з областю видимості (`debug`, `info`, `warn`, `error`)                                    |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Розв’язати шлях відносно кореня plugin                                                          |

## Угода щодо внутрішніх модулів

Усередині вашого plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Лише внутрішні експорти runtime
  index.ts          # Точка входу plugin
  setup-entry.ts    # Полегшена точка входу лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  у production-коді. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Публічні поверхні вбудованих plugins, завантажувані через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли), віддають перевагу
активному знімку конфігурації runtime, коли OpenClaw уже працює. Якщо знімок runtime
ще не існує, вони повертаються до розв’язаного конфігураційного файла на диску.

Plugins провайдерів можуть експонувати вузький локальний barrel-контракт plugin, коли
допоміжний засіб навмисно є специфічним для provider і ще не належить до узагальненого підшляху SDK.
Приклади вбудованих:

- **Anthropic**: публічний шов `api.ts` / `contract-api.ts` для допоміжних засобів
  beta-header Claude і потоку `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує конструктори provider,
  допоміжні засоби типових моделей і конструктори realtime provider.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує конструктор provider
  разом із допоміжними засобами онбордингу/конфігурації.

<Warning>
  Production-код розширень також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді є спільним, підвищте його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливості, замість зчеплення двох plugins між собою.
</Warning>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Параметри `definePluginEntry` і `defineChannelPluginEntry`.
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
  <Card title="Внутрішня будова Plugin" icon="diagram-project" href="/uk/plugins/architecture">
    Поглиблена архітектура та модель можливостей.
  </Card>
</CardGroup>
