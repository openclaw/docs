---
read_when:
    - Ви бачите попередження `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Ви бачите попередження `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Ви використовували `api.registerEmbeddedExtensionFactory` до OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури Plugin
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-28T03:20:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f98e3e5d999f8f18069f39f5d8a2f65b97003301d10e59ab5cfcf744ac0720c4
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури Plugin із цільовими, задокументованими імпортами. Якщо ваш Plugin було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система Plugin надавала дві надто широкі поверхні, які дозволяли Plugins імпортувати все, що їм потрібно, з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який повторно експортував десятки допоміжних засобів. Його було запроваджено, щоб старіші Plugins на основі hook продовжували працювати під час розробки нової архітектури Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** — широкий barrel допоміжних засобів часу виконання, який змішував системні події, стан Heartbeat, черги доставки, допоміжні засоби fetch/proxy, файлові допоміжні засоби, типи approval та несуміжні утиліти.
- **`openclaw/plugin-sdk/config-runtime`** — широкий barrel сумісності конфігурації, який досі містить застарілі прямі допоміжні засоби load/write під час вікна міграції.
- **`openclaw/extension-api`** — міст, який надавав Plugins прямий доступ до допоміжних засобів на боці хоста, таких як вбудований засіб запуску агентів.
- **`api.registerEmbeddedExtensionFactory(...)`** — вилучений hook пакетного extension лише для Pi, який міг спостерігати за подіями вбудованого runner, такими як `tool_result`.

Ці широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють під час виконання, але нові Plugins не повинні їх використовувати, а наявні Plugins слід мігрувати до того, як у наступному мажорному випуску їх буде вилучено. API реєстрації фабрики вбудованих extension лише для Pi було вилучено; натомість використовуйте middleware результатів інструментів.

OpenClaw не вилучає і не переосмислює задокументовану поведінку Plugin у тій самій зміні, яка вводить заміну. Зміни контракту, що порушують сумісність, спочатку мають пройти через адаптер сумісності, діагностику, документацію та вікно deprecation. Це стосується імпортів SDK, полів маніфесту, API налаштування, hooks і поведінки реєстрації під час виконання.

<Warning>
  Шар зворотної сумісності буде вилучено в одному з майбутніх мажорних випусків.
  Plugins, які досі імпортують із цих поверхонь, перестануть працювати, коли це станеться.
  Реєстрації фабрик вбудованих extension лише для Pi уже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного допоміжного засобу завантажував десятки несуміжних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Неясна поверхня API** — не було способу визначити, які експорти є стабільними, а які внутрішніми

Сучасний Plugin SDK це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`) є невеликим самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі зручні seams провайдера для вбудованих каналів також прибрано.
Фірмові helper-seams каналів були приватними скороченнями mono-repo, а не стабільними контрактами Plugin. Натомість використовуйте вузькі універсальні subpath SDK. Усередині робочого простору вбудованого Plugin зберігайте допоміжні засоби, що належать провайдеру, у власному `api.ts` або `runtime-api.ts` цього Plugin.

Поточні приклади вбудованих провайдерів:

- Anthropic зберігає допоміжні засоби потоку, специфічні для Claude, у власному seam `api.ts` / `contract-api.ts`
- OpenAI зберігає конструктори провайдера, допоміжні засоби моделі за замовчуванням і конструктори realtime-провайдера у власному `api.ts`
- OpenRouter зберігає конструктор провайдера та допоміжні засоби onboarding/config у власному `api.ts`

## Політика сумісності

Для зовнішніх Plugins робота із сумісністю виконується в такому порядку:

1. додати новий контракт
2. зберегти стару поведінку, підключивши її через адаптер сумісності
3. вивести діагностику або попередження з назвою старого шляху та заміни
4. покрити обидва шляхи тестами
5. задокументувати deprecation і шлях міграції
6. вилучати лише після оголошеного вікна міграції, зазвичай у мажорному випуску

Maintainers можуть перевірити поточну чергу міграції за допомогою
`pnpm plugins:boundary-report`. Звіт групує застарілі записи сумісності за датою вилучення, підраховує локальні посилання в коді/документації, показує зарезервовані імпорти SDK між різними власниками та підсумовує приватний міст SDK memory-host, щоб очищення сумісності залишалося явним, а не ґрунтувалося на ситуативних пошуках.

Якщо поле маніфесту все ще приймається, автори Plugin можуть і далі використовувати його, доки документація та діагностика не скажуть інше. Новий код має надавати перевагу задокументованій заміні, але наявні Plugins не повинні ламатися під час звичайних мінорних випусків.

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть допоміжні засоби load/write конфігурації часу виконання">
    Вбудовані Plugins мають припинити прямі виклики
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Надавайте перевагу конфігурації, яку
    вже передано в активний шлях виклику. Довгоживучі handlers, яким потрібен
    поточний snapshot процесу, можуть використовувати `api.runtime.config.current()`. Довгоживучі
    інструменти агентів мають використовувати `ctx.getRuntimeConfig()` із контексту інструмента всередині
    `execute`, щоб інструмент, створений до запису конфігурації, усе ще бачив
    оновлену конфігурацію часу виконання.

    Запис конфігурації має виконуватися через транзакційні допоміжні засоби з вибором
    політики після запису:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Використовуйте `afterWrite: { mode: "restart", reason: "..." }`, коли викликач знає,
    що зміна потребує чистого перезапуску Gateway, і
    `afterWrite: { mode: "none", reason: "..." }` лише тоді, коли викликач сам керує
    подальшими діями та свідомо хоче придушити планувальник перезавантаження.
    Результати мутації містять типізоване зведення `followUp` для тестів і логування;
    Gateway, як і раніше, відповідає за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються як застарілі допоміжні
    засоби сумісності для зовнішніх Plugins протягом вікна міграції та один раз
    показують попередження з кодом сумісності `runtime-config-load-write`. Вбудовані Plugins і код
    часу виконання репозиторію захищені scanner guardrails у
    `pnpm check:deprecated-internal-config-api` і
    `pnpm check:no-runtime-action-load-config`: нове використання у production Plugin
    завершується негайною помилкою, прямі записи конфігурації завершуються помилкою, серверні методи Gateway мають використовувати
    snapshot часу виконання запиту, helper-и send/action/client часу виконання каналу
    мають отримувати конфігурацію від своєї boundary, а довгоживучі модулі часу виконання мають
    нуль дозволених ambient-викликів `loadConfig()`.

    Новий код Plugin також має уникати імпорту широкого
    compatibility-barrel `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    subpath SDK, що відповідає завданню:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, такі як `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Перевірки вже завантаженої конфігурації та пошук конфігурації входу Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного snapshot часу виконання | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Запис конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Допоміжні засоби сховища сесій | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація таблиці Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Допоміжні засоби політики групи часу виконання | `openclaw/plugin-sdk/runtime-group-policy` |
    | Визначення secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення model/session | `openclaw/plugin-sdk/model-session-runtime` |

    Вбудовані Plugins і їхні тести захищені scanner-правилами від широкого
    barrel, щоб імпорти та mocks залишалися локальними для потрібної їм поведінки. Широкий
    barrel усе ще існує для зовнішньої сумісності, але новий код не повинен від нього залежати.

  </Step>

  <Step title="Перенесіть extension результатів інструментів Pi на middleware">
    Вбудовані Plugins мають замінити handlers
    `api.registerEmbeddedExtensionFactory(...)` результатів інструментів лише для Pi на
    runtime-neutral middleware.

    ```typescript
    // Динамічні інструменти часу виконання Pi і Codex
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Одночасно оновіть маніфест Plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Зовнішні Plugins не можуть реєструвати middleware результатів інструментів, оскільки воно може
    переписувати високодовірений вивід інструментів до того, як модель його побачить.

  </Step>

  <Step title="Перенесіть approval-native handlers на capability facts">
    Plugins каналів із підтримкою approval тепер надають нативну поведінку approval через
    `approvalCapability.nativeRuntime` разом зі спільним реєстром runtime-context.

    Основні зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть специфічні для approval auth/delivery зі старої прив’язки `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` вилучено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків login/logout каналу; approval
      hooks там більше не читаються ядром
    - Реєструйте об’єкти часу виконання, що належать каналу, такі як clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте сповіщення reroute, що належать Plugin, із нативних approval handlers;
      тепер ядро саме відповідає за routed-elsewhere notices на основі фактичних результатів доставки
    - Під час передавання `channelRuntime` до `createChannelManager(...)` надавайте
      справжню поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Див. `/plugins/sdk-channel-plugins` для актуальної
    структури approval capability.

  </Step>

  <Step title="Перевірте резервну поведінку Windows wrapper">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, невизначені Windows
    wrappers `.cmd`/`.bat` тепер завершуються fail closed, якщо ви явно не передасте
    `allowShellFallback: true`.

    ```typescript
    // До
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Після
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Установлюйте це лише для довірених сумісних викликачів, які свідомо
      // допускають резервний варіант через shell.
      allowShellFallback: true,
    });
    ```

    Якщо ваш викликач не спирається свідомо на резервний варіант через shell, не встановлюйте
    `allowShellFallback`, а натомість обробляйте викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у вашому Plugin імпорти з будь-якої застарілої поверхні:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть їх цільовими імпортами">
    Кожен експорт зі старої поверхні відповідає конкретному сучасному шляху імпорту:

    ```typescript
    // До (застарілий шар зворотної сумісності)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Після (сучасні цільові імпорти)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Для helper-ів на боці хоста використовуйте впроваджене середовище виконання Plugin замість
    прямого імпорту:

    ```typescript
    // До (застарілий міст extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Після (впроваджене середовище виконання)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується й до інших helper-ів застарілого моста:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper-и сховища сесій | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Замініть широкі імпорти infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` усе ще існує для зовнішньої
    сумісності, але новий код має імпортувати цільову поверхню helper-ів, яка
    йому фактично потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Helper-и черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper-и подій і видимості Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Зливання черги очікуваної доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Кеші дедуплікації в пам’яті | `openclaw/plugin-sdk/dedupe-runtime` |
    | Безпечні helper-и шляхів до локальних файлів/медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch з урахуванням dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper-и proxy і захищеного fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політики SSRF dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запиту/розв’язання approval | `openclaw/plugin-sdk/approval-runtime` |
    | Helper-и payload відповіді approval і команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper-и форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper-и безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена конкурентність асинхронних завдань | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Асинхронне блокування в межах процесу | `openclaw/plugin-sdk/async-lock-runtime` |
    | Блокування файлів | `openclaw/plugin-sdk/file-lock` |

    Вбудовані Plugins захищені scanner-правилами від `infra-runtime`, тому код репозиторію
    не може повернутися до широкого barrel.

  </Step>

  <Step title="Перенесіть helper-и маршрутів каналу">
    Новий код маршрутів каналу має використовувати `openclaw/plugin-sdk/channel-route`.
    Старіші назви route-key і comparable-target залишаються як aliases сумісності
    протягом вікна міграції, але нові Plugins мають використовувати назви маршрутів,
    які безпосередньо описують поведінку:

    | Старий helper | Сучасний helper |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Сучасні helper-и маршрутів узгоджено нормалізують `{ channel, to, accountId, threadId }`
    у нативних approvals, придушенні відповідей, дедуплікації вхідних повідомлень,
    доставці Cron і маршрутизації сесій. Якщо ваш Plugin використовує власну граматику
    цілей, використовуйте `resolveChannelRouteTargetWithParser(...)`, щоб адаптувати цей
    parser до того самого контракту цілі маршруту.

  </Step>

  <Step title="Зберіть і протестуйте">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Довідник шляхів імпорту

  <Accordion title="Таблиця поширених шляхів імпорту">
  | Шлях імпорту | Призначення | Ключові експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний helper точки входу Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий umbrella-реекспорт для визначень/конструкторів входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper точки входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цільові визначення й конструктори входу каналу | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні helper-и майстра налаштування | Allowlist prompts, builders статусу налаштування |
  | `plugin-sdk/setup-runtime` | Helper-и часу виконання для налаштування | Import-safe адаптери patch налаштування, helper-и приміток lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxies |
  | `plugin-sdk/setup-adapter-runtime` | Helper-и адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper-и інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper-и для кількох облікових записів | Helper-и списку облікових записів/конфігурації/action-gate |
  | `plugin-sdk/account-id` | Helper-и account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Helper-и пошуку облікового запису | Helper-и пошуку облікового запису + fallback за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі helper-и облікового запису | Helper-и списку облікових записів/account-action |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви DM pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Прив’язка префікса відповіді + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Конструктори схем конфігурації | Спільні примітиви схеми конфігурації каналу та лише універсальний builder |
  | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації вбудованих компонентів | Лише для вбудованих Plugins, які підтримує OpenClaw; нові Plugins мають визначати локальні схеми Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі схеми конфігурації вбудованих компонентів | Лише alias сумісності; для підтримуваних вбудованих Plugins використовуйте `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Helper-и конфігурації команд Telegram | Нормалізація назв команд, обрізання опису, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper-и статусу облікового запису та життєвого циклу потоку чернеток | `createAccountStatusSink`, helper-и фіналізації draft preview |
  | `plugin-sdk/inbound-envelope` | Helper-и вхідного envelope | Спільні helper-и маршруту + builder envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper-и вхідної відповіді | Спільні helper-и record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Helper-и розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Helper-и вихідного медіа | Спільне завантаження вихідного медіа |
  | `plugin-sdk/outbound-send-deps` | Helper-и залежностей вихідного надсилання | Полегшений lookup `resolveOutboundSendDep` без імпорту повного outbound runtime |
  | `plugin-sdk/outbound-runtime` | Helper-и outbound runtime | Helper-и outbound delivery, identity/send delegate, session, formatting і планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper-и thread-binding | Helper-и життєвого циклу thread-binding та адаптерів |
  | `plugin-sdk/agent-media-payload` | Застарілі helper-и media payload | Builder media payload агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти channel runtime |
  | `plugin-sdk/channel-send-result` | Типи результату надсилання | Типи результату відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі helper-и runtime | Helper-и runtime/logging/backup/plugin-install |
  | `plugin-sdk/runtime-env` | Вузькі helper-и runtime env | Logger/runtime env, helper-и timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні helper-и runtime Plugin | Helper-и команд/hooks/http/interactive Plugin |
  | `plugin-sdk/hook-runtime` | Helper-и pipeline hook | Спільні helper-и pipeline Webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Helper-и lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper-и процесу | Спільні helper-и exec |
  | `plugin-sdk/cli-runtime` | Helper-и CLI runtime | Helper-и форматування команд, очікування, версій |
  | `plugin-sdk/gateway-runtime` | Helper-и Gateway | Helper-и клієнта Gateway і patch статусу каналу |
  | `plugin-sdk/config-runtime` | Застарілий shim сумісності конфігурації | Надавайте перевагу `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helper-и команд Telegram | Стабільні helper-и перевірки команд Telegram для fallback, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Helper-и prompt approval | Payload approval exec/plugin, helper-и capability/profile approval, helper-и нативної маршрутизації/runtime approval і форматування структурованого шляху відображення approval |
  | `plugin-sdk/approval-auth-runtime` | Helper-и auth approval | Визначення approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Helper-и клієнта approval | Helper-и профілю/фільтра нативного exec approval |
  | `plugin-sdk/approval-delivery-runtime` | Helper-и доставки approval | Адаптери capability/delivery нативного approval |
  | `plugin-sdk/approval-gateway-runtime` | Helper-и Gateway approval | Спільний helper визначення Gateway approval |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper-и адаптера approval | Полегшені helper-и завантаження адаптера нативного approval для гарячих точок входу каналу |
  | `plugin-sdk/approval-handler-runtime` | Helper-и handler approval | Ширші helper-и runtime handler approval; віддавайте перевагу вужчим adapter/gateway seams, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Helper-и цілей approval | Helper-и прив’язки цілі/облікового запису нативного approval |
  | `plugin-sdk/approval-reply-runtime` | Helper-и відповіді approval | Helper-и payload відповіді exec/plugin approval |
  | `plugin-sdk/channel-runtime-context` | Helper-и channel runtime-context | Універсальні helper-и register/get/watch для channel runtime-context |
  | `plugin-sdk/security-runtime` | Helper-и безпеки | Спільні helper-и trust, DM gating, external-content і secret-collection |
  | `plugin-sdk/ssrf-policy` | Helper-и політики SSRF | Helper-и allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Helper-и SSRF runtime | Helper-и pinned-dispatcher, guarded fetch, SSRF policy |
  | `plugin-sdk/system-event-runtime` | Helper-и системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Helper-и Heartbeat | Helper-и подій і видимості Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Helper-и черги доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helper-и активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Helper-и дедуплікації | Кеші дедуплікації в пам’яті |
  | `plugin-sdk/file-access-runtime` | Helper-и доступу до файлів | Безпечні helper-и шляхів до локальних файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Helper-и готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Helper-и обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper-и діагностичного gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper-и форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, helper-и графа помилок |
  | `plugin-sdk/fetch-runtime` | Обгорнуті helper-и fetch/proxy | `resolveFetch`, helper-и proxy |
  | `plugin-sdk/host-runtime` | Helper-и нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper-и retry | `RetryConfig`, `retryAsync`, runners політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення вводу allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating команд і helper-и поверхні команд | `resolveControlCommandGate`, helper-и авторизації відправника, helper-и реєстру команд, включно з форматуванням меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери статусу/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір secret input | Helper-и secret input |
  | `plugin-sdk/webhook-ingress` | Helper-и запиту Webhook | Утиліти цілі Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper-и guard для тіла запиту Webhook | Helper-и читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний reply runtime | Inbound dispatch, Heartbeat, planner відповідей, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі helper-и dispatch відповідей | Helper-и finalize, provider dispatch і міток conversation |
  | `plugin-sdk/reply-history` | Helper-и історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper-и chunks відповіді | Helper-и chunking тексту/Markdown |
  | `plugin-sdk/session-store-runtime` | Helper-и сховища сесій | Шлях сховища + helper-и updated-at |
  | `plugin-sdk/state-paths` | Helper-и шляхів стану | Helper-и каталогів стану та OAuth |
  | `plugin-sdk/routing` | Helper-и routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper-и нормалізації session-key |
  | `plugin-sdk/status-helpers` | Helper-и статусу каналу | Builders зведення статусу каналу/облікового запису, значення runtime-state за замовчуванням, helper-и метаданих issue |
  | `plugin-sdk/target-resolver-runtime` | Helper-и визначення цілі | Спільні helper-и target resolver |
  | `plugin-sdk/string-normalization-runtime` | Helper-и нормалізації рядків | Helper-и нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Helper-и URL запиту | Витягання рядкових URL із request-подібних вхідних даних |
  | `plugin-sdk/run-command` | Helper-и команд із таймером | Runner команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Поширені зчитувачі параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витягання payload інструмента | Витягування нормалізованих payload із об’єктів результатів інструментів |
  | `plugin-sdk/tool-send` | Витягання надсилання інструмента | Витягування канонічних полів цілі надсилання з аргументів інструмента |
  | `plugin-sdk/temp-path` | Helper-и тимчасових шляхів | Спільні helper-и шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Helper-и logging | Helper-и logger підсистем і редагування |
  | `plugin-sdk/markdown-table-runtime` | Helper-и Markdown-table | Helper-и режиму таблиць Markdown |
  | `plugin-sdk/reply-payload` | Типи reply повідомлень | Типи payload відповідей |
  | `plugin-sdk/provider-setup` | Добірні helper-и налаштування локального/self-hosted провайдера | Helper-и виявлення/конфігурації self-hosted провайдера |
  | `plugin-sdk/self-hosted-provider-setup` | Цільові helper-и налаштування self-hosted провайдера, сумісного з OpenAI | Ті самі helper-и виявлення/конфігурації self-hosted провайдера |
  | `plugin-sdk/provider-auth-runtime` | Helper-и auth провайдера під час виконання | Helper-и визначення API-key під час виконання |
  | `plugin-sdk/provider-auth-api-key` | Helper-и налаштування API-key провайдера | Helper-и onboarding/profile-write для API-key |
  | `plugin-sdk/provider-auth-result` | Helper-и auth-result провайдера | Стандартний builder auth-result OAuth |
  | `plugin-sdk/provider-auth-login` | Helper-и інтерактивного login провайдера | Спільні helper-и інтерактивного login |
  | `plugin-sdk/provider-selection-runtime` | Helper-и вибору провайдера | Helper-и вибору налаштованого або автоматичного провайдера та злиття необробленої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Helper-и env-var провайдера | Helper-и пошуку env-var auth провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні helper-и model/replay провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builders replay-policy, helper-и endpoint провайдера та helper-и нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні helper-и каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches onboarding провайдера | Helper-и конфігурації onboarding |
  | `plugin-sdk/provider-http` | Helper-и HTTP провайдера | Універсальні helper-и можливостей HTTP/endpoint провайдера, включно з helper-ами multipart form для транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Helper-и web-fetch провайдера | Helper-и реєстрації/кешу провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper-и конфігурації web-search провайдера | Вузькі helper-и конфігурації/облікових даних web-search для провайдерів, яким не потрібна прив’язка enable Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper-и контракту web-search провайдера | Вузькі helper-и контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setters/getters облікових даних |
  | `plugin-sdk/provider-web-search` | Helper-и web-search провайдера | Helper-и реєстрації/кешу/runtime провайдера web-search |
  | `plugin-sdk/provider-tools` | Helper-и сумісності tool/schema провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + diagnostics і helper-и сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper-и usage провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші helper-и usage провайдера |
  | `plugin-sdk/provider-stream` | Helper-и обгорток stream провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток stream і спільні helper-и обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper-и транспорту провайдера | Helper-и нативного транспорту провайдера, такі як guarded fetch, трансформації повідомлень транспорту та writable event streams транспорту |
  | `plugin-sdk/keyed-async-queue` | Упорядкована async-черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні helper-и медіа | Helper-и fetch/transform/store медіа плюс builders media payload |
  | `plugin-sdk/media-generation-runtime` | Спільні helper-и генерації медіа | Спільні helper-и failover, вибір candidate і повідомлення про відсутню model для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Helper-и media-understanding | Типи провайдера media understanding плюс provider-facing helper-експорти для зображення/аудіо |
  | `plugin-sdk/text-runtime` | Спільні helper-и тексту | Видалення тексту, видимого асистенту, helper-и render/chunking/table Markdown, helper-и редагування, helper-и directive-tag, утиліти safe-text і пов’язані helper-и text/logging |
  | `plugin-sdk/text-chunking` | Helper-и chunking тексту | Helper chunking вихідного тексту |
  | `plugin-sdk/speech` | Helper-и speech | Типи провайдера speech плюс provider-facing helper-и directive, registry, validation і builder TTS, сумісний з OpenAI |
  | `plugin-sdk/speech-core` | Спільне ядро speech | Типи провайдера speech, registry, directives, нормалізація |
  | `plugin-sdk/realtime-transcription` | Helper-и транскрипції в реальному часі | Типи провайдера, helper-и registry і спільний helper сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Helper-и голосу в реальному часі | Типи провайдера, helper-и registry/resolution і helper-и bridge session |
  | `plugin-sdk/image-generation` | Helper-и генерації зображень | Типи провайдера генерації зображень плюс helper-и image asset/data URL і builder провайдера зображень, сумісний з OpenAI |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, helper-и failover, auth і registry |
  | `plugin-sdk/music-generation` | Helper-и генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, helper-и failover, lookup провайдера та розбір model-ref |
  | `plugin-sdk/video-generation` | Helper-и генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, helper-и failover, lookup провайдера та розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Helper-и інтерактивної відповіді | Нормалізація/скорочення payload інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helper-и запису конфігурації каналу | Helper-и авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільний prelude каналу | Експорти спільного prelude channel Plugin |
  | `plugin-sdk/channel-status` | Helper-и статусу каналу | Спільні helper-и snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Helper-и конфігурації allowlist | Helper-и edit/read конфігурації allowlist |
  | `plugin-sdk/group-access` | Helper-и доступу до груп | Спільні helper-и визначення group-access |
  | `plugin-sdk/direct-dm` | Helper-и direct-DM | Спільні helper-и auth/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні helper-и extension | Примітиви helper-ів passive-channel/status і ambient proxy |
  | `plugin-sdk/webhook-targets` | Helper-и цілей Webhook | Реєстр цілей Webhook і helper-и встановлення route |
  | `plugin-sdk/webhook-path` | Helper-и шляху Webhook | Helper-и нормалізації шляху Webhook |
  | `plugin-sdk/web-media` | Спільні helper-и web media | Helper-и завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Реекспорт Zod | Повторно експортований `zod` для споживачів Plugin SDK |
  | `plugin-sdk/memory-core` | Вбудовані helper-и memory-core | Поверхня helper-ів менеджера/config/file/CLI пам’яті |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime facade механізму пам’яті | Runtime facade індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий механізм host пам’яті | Експорти базового механізму host пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Механізм embeddings host пам’яті | Контракти embedding пам’яті, доступ до registry, локальний провайдер і універсальні batch/remote helper-и; конкретні remote-провайдери знаходяться у Plugins, яким вони належать |
  | `plugin-sdk/memory-core-host-engine-qmd` | Механізм QMD host пам’яті | Експорти механізму QMD host пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Механізм сховища host пам’яті | Експорти механізму сховища host пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні helper-и host пам’яті | Мультимодальні helper-и host пам’яті |
  | `plugin-sdk/memory-core-host-query` | Helper-и запитів host пам’яті | Helper-и запитів host пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Helper-и secret host пам’яті | Helper-и secret host пам’яті |
  | `plugin-sdk/memory-core-host-events` | Helper-и журналу подій host пам’яті | Helper-и журналу подій host пам’яті |
  | `plugin-sdk/memory-core-host-status` | Helper-и статусу host пам’яті | Helper-и статусу host пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime host пам’яті | Helper-и CLI runtime host пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime host пам’яті | Helper-и core runtime host пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper-и файлів/runtime host пам’яті | Helper-и файлів/runtime host пам’яті |
  | `plugin-sdk/memory-host-core` | Alias core runtime host пам’яті | Vendor-neutral alias для helper-ів core runtime host пам’яті |
  | `plugin-sdk/memory-host-events` | Alias журналу подій host пам’яті | Vendor-neutral alias для helper-ів журналу подій host пам’яті |
  | `plugin-sdk/memory-host-files` | Alias файлів/runtime host пам’яті | Vendor-neutral alias для helper-ів файлів/runtime host пам’яті |
  | `plugin-sdk/memory-host-markdown` | Helper-и керованого Markdown | Спільні helper-и керованого Markdown для Plugins, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | facade пошуку Active Memory | Лінива runtime facade менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Alias статусу host пам’яті | Vendor-neutral alias для helper-ів статусу host пам’яті |
  | `plugin-sdk/memory-lancedb` | Вбудовані helper-и memory-lancedb | Поверхня helper-ів memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Застарілий широкий compatibility-barrel; надавайте перевагу цільовим test subpaths, таким як `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно охоплює поширену підмножину для міграції, а не всю
поверхню SDK. Повний список із понад 200 точок входу знаходиться в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список і далі містить деякі helper-seams вбудованих Plugins, наприклад
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й далі експортуються для
підтримки та сумісності вбудованих Plugins, але навмисно не включені до
таблиці поширеної міграції й не є рекомендованою ціллю для нового коду Plugin.

Те саме правило застосовується й до інших сімейств вбудованих helper-ів, зокрема:

- helper-и підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні вбудованих helper-ів/Plugins, як-от `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку поверхню helper-ів токена:
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти експорт,
перевірте джерело в `src/plugin-sdk/` або запитайте в Discord.

## Активні deprecations

Вужчі deprecations, що застосовуються в усьому Plugin SDK, контракті провайдера,
поверхні runtime і маніфесті. Кожен із них сьогодні все ще працює, але буде вилучений
у майбутньому мажорному випуску. Запис під кожним пунктом зіставляє старий API з його
канонічною заміною.

<AccordionGroup>
  <Accordion title="builders довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — лише імпорт із вужчого subpath. `command-auth`
    повторно експортує їх як compat stubs.

    ```typescript
    // До
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Після
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helper-и gating згадок → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    один об’єкт рішення замість двох розділених викликів.

    Downstream channel Plugins (Slack, Discord, Matrix, Microsoft Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Shim channel runtime і helper-и дій каналу">
    `openclaw/plugin-sdk/channel-runtime` — це shim сумісності для старіших
    channel Plugins. Не імпортуйте його в новому коді; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації об’єктів
    runtime.

    Helper-и `channelActions*` у `openclaw/plugin-sdk/channel-actions` є
    застарілими разом із сирими експортами channel "actions". Натомість
    надавайте можливості через семантичну поверхню `presentation` — channel Plugins
    оголошують, що саме вони відображають (cards, buttons, selects), а не які сирі
    назви action вони приймають.

  </Accordion>

  <Accordion title="Helper tool() провайдера web search → createTool() у Plugin">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо у Plugin провайдера.
    OpenClaw більше не потребує helper-а SDK для реєстрації обгортки інструмента.

  </Accordion>

  <Accordion title="Конверти каналів у plaintext → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плоского prompt-конверта
    plaintext із вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача.
    Channel Plugins додають метадані маршрутизації (thread, topic, reply-to, reactions) як
    типізовані поля замість конкатенації їх у рядок prompt.
    Helper `formatAgentEnvelope(...)` і далі підтримується для синтезованих
    конвертів, видимих асистенту, але вхідні plaintext-конверти поступово
    виводяться з ужитку.

    Порушені області: `inbound_claim`, `message_received` і будь-який власний
    channel Plugin, який постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи виявлення провайдера → типи каталогу провайдера">
    Чотири aliases типів виявлення тепер є тонкими обгортками над типами
    епохи каталогу:

    | Старий alias                 | Новий тип                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс застарілий статичний набір `ProviderCapabilities` — Plugins провайдера
    мають прив’язувати facts можливостей через контракт runtime провайдера,
    а не через статичний об’єкт.

  </Accordion>

  <Accordion title="Hooks політики Thinking → resolveThinkingProfile">
    **Старе** (три окремі hooks у `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: єдиний `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` із канонічним `id`, необов’язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично знижує застарілі збережені
    значення за рангом профілю.

    Реалізуйте один hook замість трьох. Застарілі hooks і далі працюють протягом
    вікна deprecation, але не композуються з результатом профілю.

  </Accordion>

  <Accordion title="Fallback зовнішнього OAuth-провайдера → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення провайдера в маніфесті Plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті Plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях
    "auth fallback" виводить попередження під час runtime і буде вилучений.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Пошук env-var провайдера → setup.providers[].envVars">
    **Старе** поле маніфесту: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: дублюйте той самий пошук env-var у `setup.providers[].envVars`
    в маніфесті. Це об’єднує метадані env налаштування/статусу в одному
    місці та дозволяє уникнути запуску runtime Plugin лише для відповіді на
    запити щодо env-var.

    `providerAuthEnvVars` і далі підтримується через адаптер сумісності
    до завершення вікна deprecation.

  </Accordion>

  <Accordion title="Реєстрація memory Plugin → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі slots, один виклик реєстрації. Додаткові helper-и пам’яті
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) це не зачіпає.

  </Accordion>

  <Accordion title="Перейменовано типи повідомлень сесій subagent">
    Два застарілі aliases типів і далі експортуються з `src/plugins/runtime/types.ts`:

    | Старе                           | Нове                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` є застарілим на користь
    `getSessionMessages`. Та сама сигнатура; старий метод делегує виклик
    новому.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Старе**: `runtime.tasks.flow` (в однині) повертав живий accessor TaskFlow.

    **Нове**: `runtime.tasks.flows` (у множині) повертає DTO-орієнтований доступ до TaskFlow,
    який є import-safe і не потребує завантаження повного task runtime.

    ```typescript
    // До
    const flow = api.runtime.tasks.flow(ctx);
    // Після
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Фабрики вбудованих extension → middleware результатів інструментів агента">
    Розглянуто вище в розділі "Як виконати міграцію → Перенесіть extension результатів інструментів Pi на
    middleware". Для повноти тут також зазначено: вилучений шлях
    `api.registerEmbeddedExtensionFactory(...)` лише для Pi замінено на
    `api.registerAgentToolResultMiddleware(...)` із явним списком runtime
    у `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, який повторно експортується з `openclaw/plugin-sdk`, тепер є
    однорядковим alias для `OpenClawConfig`. Надавайте перевагу канонічній назві.

    ```typescript
    // До
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Після
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Deprecations на рівні extension (усередині вбудованих channel/provider Plugins у
`extensions/`) відстежуються у власних barrels `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх Plugins і тут не перелічуються.
Якщо ви напряму використовуєте локальний barrel вбудованого Plugin, перед
оновленням прочитайте коментарі deprecation у цьому barrel.
</Note>

## Хронологія вилучення

| Коли                   | Що відбувається                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**                | Застарілі поверхні виводять попередження під час runtime                               |
| **Наступний мажорний випуск** | Застарілі поверхні буде вилучено; Plugins, які досі їх використовують, перестануть працювати |

Усі core Plugins уже мігровано. Зовнішнім Plugins слід виконати міграцію
до наступного мажорного випуску.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний механізм, а не постійне рішення.

## Пов’язані матеріали

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Plugins каналів](/uk/plugins/sdk-channel-plugins) — створення Plugins каналів
- [Plugins провайдерів](/uk/plugins/sdk-provider-plugins) — створення Plugins провайдерів
- [Внутрішня будова Plugin](/uk/plugins/architecture) — глибоке занурення в архітектуру
- [Маніфест Plugin](/uk/plugins/manifest) — довідник зі схеми маніфесту
