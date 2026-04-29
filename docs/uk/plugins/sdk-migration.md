---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували api.registerEmbeddedExtensionFactory до версії OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури Plugin
    - Ви підтримуєте зовнішній Plugin для OpenClaw
sidebarTitle: Migrate to SDK
summary: Перехід із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-29T11:23:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0ef5d3c435d84060bfd0e68fc32a7b2df196cd1cee20512cf793c024df0bfdc2
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури Plugin
із вузькими, задокументованими імпортами. Якщо ваш Plugin було створено до
нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система Plugin надавала дві широко відкриті поверхні, які дозволяли Plugin імпортувати
все потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який повторно експортував десятки
  допоміжних функцій. Його було введено, щоб підтримати роботу старіших Plugin на основі хуків, поки
  створювалася нова архітектура Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** — широкий barrel runtime-допоміжних функцій, який
  змішував системні події, стан Heartbeat, черги доставки, допоміжні функції fetch/proxy,
  файлові допоміжні функції, типи схвалень і непов’язані утиліти.
- **`openclaw/plugin-sdk/config-runtime`** — широкий barrel сумісності конфігурації,
  який і далі містить застарілі прямі допоміжні функції завантаження/запису під час міграційного
  вікна.
- **`openclaw/extension-api`** — міст, який давав Plugin прямий доступ до
  допоміжних функцій на боці хоста, як-от вбудований runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** — вилучений хук bundled
  розширення лише для Pi, який міг спостерігати події embedded-runner, такі як
  `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють під час виконання,
але нові Plugin не повинні їх використовувати, а наявні Plugin мають мігрувати до того,
як наступний major release їх вилучить. API реєстрації embedded extension factory лише для Pi
вилучено; натомість використовуйте middleware результатів інструментів.

OpenClaw не вилучає й не переінтерпретовує задокументовану поведінку Plugin у тій самій
зміні, яка вводить заміну. Критичні зміни контракту спершу мають пройти через
адаптер сумісності, діагностику, документацію та вікно deprecation.
Це стосується імпортів SDK, полів manifest, setup APIs, хуків і поведінки
runtime-реєстрації.

<Warning>
  Шар зворотної сумісності буде вилучено в майбутньому major release.
  Plugin, які досі імпортують із цих поверхонь, зламаються, коли це станеться.
  Реєстрації embedded extension factory лише для Pi вже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт однієї допоміжної функції завантажував десятки непов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпортів
- **Нечітка поверхня API** — не було способу зрозуміти, які експорти стабільні, а які внутрішні

Сучасний plugin SDK це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим, самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі provider convenience seams для bundled channels також вилучено.
Channel-branded допоміжні seams були приватними скороченнями monorepo, а не стабільними
контрактами Plugin. Натомість використовуйте вузькі generic SDK subpaths. Усередині bundled
plugin workspace тримайте provider-owned допоміжні функції у власному `api.ts` або
`runtime-api.ts` цього Plugin.

Поточні приклади bundled providers:

- Anthropic тримає специфічні для Claude stream-допоміжні функції у власному seam `api.ts` /
  `contract-api.ts`
- OpenAI тримає provider builders, default-model helpers і realtime provider
  builders у власному `api.ts`
- OpenRouter тримає provider builder і onboarding/config helpers у власному
  `api.ts`

## Політика сумісності

Для зовнішніх Plugin робота із сумісністю виконується в такому порядку:

1. додати новий контракт
2. залишити стару поведінку, підключену через адаптер сумісності
3. видавати діагностику або попередження, яке називає старий шлях і заміну
4. покрити обидва шляхи тестами
5. задокументувати deprecation і шлях міграції
6. вилучати лише після оголошеного міграційного вікна, зазвичай у major release

Maintainers можуть перевірити поточну чергу міграції за допомогою
`pnpm plugins:boundary-report`. Використовуйте `pnpm plugins:boundary-report:summary` для
компактних підрахунків, `--owner <id>` для одного Plugin або власника сумісності, і
`pnpm plugins:boundary-report:ci`, коли CI gate має падати через прострочені
записи сумісності, cross-owner reserved SDK imports або unused reserved SDK
subpaths. Звіт групує застарілі
записи сумісності за датою вилучення, підраховує локальні посилання в code/docs,
показує cross-owner reserved SDK imports і підсумовує приватний
memory-host SDK bridge, щоб cleanup сумісності залишався явним, а не
покладався на ad hoc пошуки. Reserved SDK subpaths повинні мати tracked owner usage;
unused reserved helper exports слід вилучати з публічного SDK.

Якщо поле manifest усе ще приймається, authors Plugin можуть продовжувати ним користуватися, доки
документація й діагностика не скажуть інакше. Новий код має віддавати перевагу задокументованій
заміні, але наявні Plugin не повинні ламатися під час звичайних minor
releases.

## Як виконати міграцію

<Steps>
  <Step title="Мігруйте runtime helper-и завантаження/запису конфігурації">
    Bundled Plugin мають припинити безпосередньо викликати
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Віддавайте перевагу конфігурації, яку вже було
    передано в активний шлях виклику. Довгоживучі handlers, яким потрібен
    поточний snapshot процесу, можуть використовувати `api.runtime.config.current()`. Довгоживучі
    agent tools мають використовувати `ctx.getRuntimeConfig()` з контексту інструмента всередині
    `execute`, щоб інструмент, створений до запису конфігурації, все одно бачив оновлену
    runtime config.

    Записи конфігурації мають проходити через транзакційні helper-и й обирати
    after-write policy:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Використовуйте `afterWrite: { mode: "restart", reason: "..." }`, коли caller знає,
    що зміна потребує чистого перезапуску Gateway, і
    `afterWrite: { mode: "none", reason: "..." }` лише тоді, коли caller володіє
    follow-up і свідомо хоче приглушити reload planner.
    Результати мутації містять типізований summary `followUp` для тестів і logging;
    Gateway залишається відповідальним за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються застарілими helper-ами сумісності
    для зовнішніх Plugin під час міграційного вікна й один раз попереджають із
    compatibility code `runtime-config-load-write`. Bundled Plugin і runtime-код репозиторію
    захищені scanner guardrails у
    `pnpm check:deprecated-internal-config-api` і
    `pnpm check:no-runtime-action-load-config`: нове production використання Plugin
    одразу падає, прямі записи конфігурації падають, gateway server methods мають використовувати
    request runtime snapshot, runtime channel send/action/client helpers
    мають отримувати конфігурацію зі своєї межі, а довгоживучі runtime modules мають
    нуль дозволених ambient викликів `loadConfig()`.

    Новий код Plugin також має уникати імпорту широкого
    compatibility barrel `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    SDK subpath, що відповідає завданню:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, такі як `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Already-loaded config assertions і plugin-entry config lookup | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного runtime snapshot | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Helper-и session store | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown table config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime helper-и group policy | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret input resolution | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/session overrides | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled Plugin та їхні тести захищені scanner-ами від широкого
    barrel, щоб imports і mocks залишалися локальними до потрібної їм поведінки. Широкий
    barrel усе ще існує для зовнішньої сумісності, але новий код не повинен
    від нього залежати.

  </Step>

  <Step title="Мігруйте Pi tool-result extensions на middleware">
    Bundled Plugin мають замінити Pi-only
    `api.registerEmbeddedExtensionFactory(...)` tool-result handlers на
    runtime-neutral middleware.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Водночас оновіть manifest Plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Зовнішні Plugin не можуть реєструвати tool-result middleware, бо воно може
    переписувати high-trust output інструмента до того, як модель його побачить.

  </Step>

  <Step title="Мігруйте approval-native handlers на capability facts">
    Approval-capable channel Plugin тепер expose native approval behavior через
    `approvalCapability.nativeRuntime` плюс shared runtime-context registry.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть approval-specific auth/delivery зі старого wiring `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` вилучено з публічного contract channel-plugin;
      перенесіть delivery/native/render fields на `approvalCapability`
    - `plugin.auth` залишається лише для channel login/logout flows; approval auth
      hooks там більше не читаються core
    - Реєструйте channel-owned runtime objects, як-от clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте plugin-owned reroute notices із native approval handlers;
      core тепер володіє routed-elsewhere notices з фактичних delivery results
    - Передаючи `channelRuntime` у `createChannelManager(...)`, надайте
      справжню поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Див. `/plugins/sdk-channel-plugins` для поточного layout approval capability.

  </Step>

  <Step title="Перевірте fallback-поведінку Windows wrapper">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані Windows
    `.cmd`/`.bat` wrappers тепер fail closed, якщо ви явно не передасте
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Якщо ваш caller не покладається свідомо на shell fallback, не встановлюйте
    `allowShellFallback` і натомість обробіть thrown error.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Пошукайте у своєму Plugin імпорти з будь-якої застарілої поверхні:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на вузькі імпорти">
    Кожен експорт зі старої поверхні відповідає конкретному сучасному шляху імпорту:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Для host-side helper-ів використовуйте injected plugin runtime замість прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується до інших застарілих допоміжних засобів мосту:

    | Старий import | Сучасний відповідник |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | допоміжні засоби сховища сесій | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Замініть широкі імпорти infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` усе ще існує для зовнішньої
    сумісності, але новий код має імпортувати цільову поверхню допоміжних засобів,
    яка йому справді потрібна:

    | Потреба | Import |
    | --- | --- |
    | Допоміжні засоби черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Допоміжні засоби подій Heartbeat і видимості | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Очищення черги очікуваної доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Кеші дедуплікації в пам'яті | `openclaw/plugin-sdk/dedupe-runtime` |
    | Безпечні допоміжні засоби для шляхів локальних файлів/медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch з урахуванням диспетчера | `openclaw/plugin-sdk/runtime-fetch` |
    | Допоміжні засоби проксі та захищеного fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політики диспетчера SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запиту/вирішення затвердження | `openclaw/plugin-sdk/approval-runtime` |
    | Допоміжні засоби payload відповіді затвердження та команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Допоміжні засоби форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Допоміжні засоби безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена конкурентність асинхронних завдань | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Локальний для процесу асинхронний lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | Файлові locks | `openclaw/plugin-sdk/file-lock` |

    Вбудовані Plugin-и захищено сканером від `infra-runtime`, тож код репозиторію
    не може регресувати до широкого barrel.

  </Step>

  <Step title="Мігруйте допоміжні засоби маршрутів каналів">
    Новий код маршрутів каналів має використовувати `openclaw/plugin-sdk/channel-route`.
    Старі назви ключа маршруту та порівнюваної цілі залишаються псевдонімами
    сумісності протягом вікна міграції, але нові Plugin-и мають використовувати
    назви маршрутів, які безпосередньо описують поведінку:

    | Старий допоміжний засіб | Сучасний допоміжний засіб |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Сучасні допоміжні засоби маршрутів узгоджено нормалізують `{ channel, to, accountId, threadId }`
    для нативних затверджень, приглушення відповідей, вхідної дедуплікації,
    доставки Cron і маршрутизації сесій. Якщо ваш Plugin має власну граматику цілі,
    використовуйте `resolveChannelRouteTargetWithParser(...)`, щоб адаптувати цей
    parser до того самого контракту цілі маршруту.

  </Step>

  <Step title="Зберіть і протестуйте">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Довідник шляхів import

  <Accordion title="Common import path table">
  | Шлях імпорту | Призначення | Ключові експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний засіб входу plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий парасольковий реекспорт для визначень/побудовників входів каналів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення та побудовники входів каналів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Запити списку дозволених, побудовники стану налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime під час налаштування | Безпечні для імпорту адаптери патчів налаштування, допоміжні засоби приміток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку облікових записів/конфігурації/шлюзу дій |
  | `plugin-sdk/account-id` | Допоміжні засоби ID облікового запису | `DEFAULT_ACCOUNT_ID`, нормалізація ID облікового запису |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису | Допоміжні засоби пошуку облікового запису + типового fallback |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби облікового запису | Допоміжні засоби списку облікових записів/дій облікового запису |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, плюс `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви створення пари через DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді, індикація введення та зв’язування доставки джерела | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Побудовники схем конфігурації | Спільні примітиви схеми конфігурації каналів і лише загальний побудовник |
  | `plugin-sdk/bundled-channel-config-schema` | Вбудовані схеми конфігурації | Лише вбудовані plugins, підтримувані OpenClaw; нові plugins мають визначати локальні для plugin схеми |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі вбудовані схеми конфігурації | Лише псевдонім сумісності; використовуйте `plugin-sdk/bundled-channel-config-schema` для підтримуваних вбудованих plugins |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Розв’язання політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Допоміжні засоби стану облікового запису та життєвого циклу чернеткового потоку | `createAccountStatusSink`, допоміжні засоби фіналізації попереднього перегляду чернетки |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби вхідного конверта | Спільні допоміжні засоби маршруту + побудовника конверта |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби вхідної відповіді | Спільні допоміжні засоби запису та диспетчеризації |
  | `plugin-sdk/messaging-targets` | Розбір цілі повідомлення | Допоміжні засоби розбору/зіставлення цілі |
  | `plugin-sdk/outbound-media` | Допоміжні засоби вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Допоміжні засоби залежностей вихідного надсилання | Легкий пошук `resolveOutboundSendDep` без імпорту повного вихідного runtime |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідного runtime | Допоміжні засоби вихідної доставки, делегата ідентичності/надсилання, сесії, форматування та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби прив’язки потоків | Допоміжні засоби життєвого циклу прив’язки потоків і адаптера |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби payload медіа | Побудовник payload медіа агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише утиліти runtime каналів для застарілої сумісності |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/логування/резервного копіювання/встановлення plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби середовища runtime | Допоміжні засоби логера/середовища runtime, тайм-ауту, повтору та backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби runtime plugin | Допоміжні засоби команд/plugin hooks/http/інтерактивності plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра hooks | Спільні допоміжні засоби конвеєра Webhook/внутрішніх hooks |
  | `plugin-sdk/lazy-runtime` | Ліниві допоміжні засоби runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби runtime CLI | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Допоміжні засоби клієнта Gateway і патчів стану каналу |
  | `plugin-sdk/config-runtime` | Застарілий shim сумісності конфігурації | Надавайте перевагу `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Стабільні щодо fallback допоміжні засоби перевірки команд Telegram, коли поверхня вбудованого контракту Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби запитів схвалення | Payload схвалення exec/plugin, допоміжні засоби можливостей/профілю схвалення, маршрутизація/допоміжні засоби runtime нативного схвалення та форматування структурованого шляху відображення схвалення |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби авторизації схвалення | Визначення approver, авторизація дії в тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта схвалення | Допоміжні засоби профілю/фільтра нативного схвалення exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки схвалень | Адаптери можливостей/доставки нативного схвалення |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби Gateway схвалень | Спільний допоміжний засіб розв’язання Gateway схвалень |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера схвалення | Легкі допоміжні засоби завантаження адаптера нативного схвалення для гарячих точок входу каналів |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника схвалення | Ширші допоміжні засоби runtime обробника схвалення; надавайте перевагу вужчим швам адаптера/Gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілі схвалення | Допоміжні засоби прив’язки цілі/облікового запису нативного схвалення |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповіді на схвалення | Допоміжні засоби payload відповіді на схвалення exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби runtime-контексту каналу | Загальні допоміжні засоби реєстрації/отримання/спостереження runtime-контексту каналу |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби довіри, шлюзування DM, зовнішнього вмісту та збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби списку дозволених хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби runtime SSRF | Pinned-dispatcher, захищений fetch, допоміжні засоби політики SSRF |
  | `plugin-sdk/system-event-runtime` | Допоміжні засоби системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби Heartbeat | Допоміжні засоби подій Heartbeat і видимості |
  | `plugin-sdk/delivery-queue-runtime` | Допоміжні засоби черги доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Допоміжні засоби активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Допоміжні засоби дедуплікації | In-memory кеші дедуплікації |
  | `plugin-sdk/file-access-runtime` | Допоміжні засоби доступу до файлів | Допоміжні засоби безпечних локальних шляхів файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Допоміжні засоби готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичного шлюзування | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch/proxy | `resolveFetch`, допоміжні засоби proxy, допоміжні засоби опцій EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хостів | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби повторів | `RetryConfig`, `retryAsync`, засоби виконання політик |
  | `plugin-sdk/allow-from` | Форматування списку дозволених | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Зіставлення введення списку дозволених | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Допоміжні засоби шлюзування команд і командної поверхні | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери стану/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір секретного введення | Допоміжні засоби секретного введення |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби захисту тіла Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповідей | Вхідна диспетчеризація, Heartbeat, планувальник відповідей, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації відповідей | Фіналізація, диспетчеризація провайдера та допоміжні засоби міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби фрагментів відповіді | Допоміжні засоби chunking тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій | Шлях сховища + допоміжні засоби updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів стану та OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби маршрутизації/ключа сесії | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації ключа сесії |
  | `plugin-sdk/status-helpers` | Допоміжні засоби стану каналу | Побудовники підсумку стану каналу/облікового запису, типові значення runtime-state, допоміжні засоби метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби розв’язувача цілей | Спільні допоміжні засоби розв’язувача цілей |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Витягувати рядкові URL з подібних до запиту вхідних даних |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із таймінгом | Засіб запуску команд із таймінгом і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Спільні зчитувачі параметрів інструментів/CLI |
  | `plugin-sdk/tool-payload` | Витяг payload інструменту | Витягувати нормалізовані payload з об’єктів результату інструменту |
  | `plugin-sdk/tool-send` | Витяг надсилання інструменту | Витягувати канонічні поля цілі надсилання з аргументів інструменту |
  | `plugin-sdk/temp-path` | Помічники тимчасових шляхів | Спільні помічники шляхів для тимчасових завантажень |
  | `plugin-sdk/logging-core` | Помічники журналювання | Помічники журналера підсистем і редагування конфіденційних даних |
  | `plugin-sdk/markdown-table-runtime` | Помічники Markdown-таблиць | Помічники режиму Markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи відповідей на повідомлення | Типи payload відповіді |
  | `plugin-sdk/provider-setup` | Керовані помічники налаштування локальних/самостійно розміщених провайдерів | Помічники виявлення/конфігурації самостійно розміщених провайдерів |
  | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані помічники налаштування OpenAI-сумісних самостійно розміщених провайдерів | Ті самі помічники виявлення/конфігурації самостійно розміщених провайдерів |
  | `plugin-sdk/provider-auth-runtime` | Помічники runtime-автентифікації провайдерів | Помічники runtime-визначення API-ключів |
  | `plugin-sdk/provider-auth-api-key` | Помічники налаштування API-ключів провайдера | Помічники onboarding/запису профілю для API-ключів |
  | `plugin-sdk/provider-auth-result` | Помічники auth-result провайдера | Стандартний builder OAuth auth-result |
  | `plugin-sdk/provider-auth-login` | Помічники інтерактивного входу провайдера | Спільні помічники інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Помічники вибору провайдера | Вибір налаштованого або автоматичного провайдера та об’єднання сирої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Помічники env-var провайдера | Помічники пошуку env-var автентифікації провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні помічники моделей/відтворення провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builders політик відтворення, помічники provider-endpoint і помічники нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні помічники каталогу провайдерів | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі onboarding провайдера | Помічники onboarding-конфігурації |
  | `plugin-sdk/provider-http` | HTTP-помічники провайдера | Загальні помічники можливостей HTTP/endpoint провайдера, зокрема помічники multipart form для транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Помічники web-fetch провайдера | Помічники реєстрації/кешу web-fetch провайдера |
  | `plugin-sdk/provider-web-search-config-contract` | Помічники конфігурації web-search провайдера | Вузькі помічники конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення plugin-enable |
  | `plugin-sdk/provider-web-search-contract` | Помічники контракту web-search провайдера | Вузькі помічники контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setters/getters облікових даних |
  | `plugin-sdk/provider-web-search` | Помічники web-search провайдера | Помічники реєстрації/кешу/runtime web-search провайдера |
  | `plugin-sdk/provider-tools` | Помічники сумісності інструментів/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та помічники сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Помічники використання провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші помічники використання провайдера |
  | `plugin-sdk/provider-stream` | Помічники wrapper потоку провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні помічники wrapper для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Помічники транспорту провайдера | Помічники нативного транспорту провайдера, як-от guarded fetch, перетворення транспортних повідомлень і writable transport event streams |
  | `plugin-sdk/keyed-async-queue` | Впорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні помічники медіа | Помічники отримання/перетворення/збереження медіа, визначення розмірів відео на основі ffprobe та builders медіа payload |
  | `plugin-sdk/media-generation-runtime` | Спільні помічники генерації медіа | Спільні помічники failover, вибір кандидатів і повідомлення про відсутні моделі для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Помічники розуміння медіа | Типи провайдера розуміння медіа, а також provider-facing експорти помічників зображень/аудіо |
  | `plugin-sdk/text-runtime` | Спільні помічники тексту | Видалення видимого для асистента тексту, помічники рендерингу/розбиття на фрагменти/таблиць Markdown, помічники редагування конфіденційних даних, помічники directive-tag, утиліти safe-text і пов’язані помічники тексту/журналювання |
  | `plugin-sdk/text-chunking` | Помічники розбиття тексту на фрагменти | Помічник розбиття вихідного тексту на фрагменти |
  | `plugin-sdk/speech` | Помічники мовлення | Типи провайдера мовлення, а також provider-facing помічники директив, реєстру, валідації та OpenAI-сумісний builder TTS |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдера мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Помічники транскрипції в реальному часі | Типи провайдера, помічники реєстру та спільний помічник WebSocket-сесії |
  | `plugin-sdk/realtime-voice` | Помічники голосу в реальному часі | Типи провайдера, помічники реєстру/визначення та помічники bridge-сесій |
  | `plugin-sdk/image-generation` | Помічники генерації зображень | Типи провайдера генерації зображень, а також помічники asset/data URL для зображень і OpenAI-сумісний builder провайдера зображень |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, failover, автентифікація та помічники реєстру |
  | `plugin-sdk/music-generation` | Помічники генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, помічники failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/video-generation` | Помічники генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, помічники failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Помічники інтерактивних відповідей | Нормалізація/зведення payload інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви config-schema каналу |
  | `plugin-sdk/channel-config-writes` | Помічники запису конфігурації каналу | Помічники авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула каналу | Спільні експорти преамбули Plugin каналу |
  | `plugin-sdk/channel-status` | Помічники статусу каналу | Спільні помічники snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Помічники конфігурації allowlist | Помічники редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Помічники групового доступу | Спільні помічники рішень щодо групового доступу |
  | `plugin-sdk/direct-dm` | Помічники прямих DM | Спільні помічники автентифікації/guard для прямих DM |
  | `plugin-sdk/extension-shared` | Спільні помічники extension | Примітиви помічників passive-channel/status та ambient proxy |
  | `plugin-sdk/webhook-targets` | Помічники цілей Webhook | Реєстр цілей Webhook і помічники встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Помічники шляху Webhook | Помічники нормалізації шляху Webhook |
  | `plugin-sdk/web-media` | Спільні помічники вебмедіа | Помічники завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Реекспорт Zod | Реекспортований `zod` для споживачів SDK плагінів |
  | `plugin-sdk/memory-core` | Вбудовані помічники memory-core | Поверхня помічників менеджера/конфігурації/файлів/CLI пам’яті |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime-фасад рушія пам’яті | Runtime-фасад індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій хоста пам’яті | Експорти базового рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embeddings хоста пам’яті | Контракти embeddings пам’яті, доступ до реєстру, локальний провайдер і загальні batch/remote помічники; конкретні віддалені провайдери живуть у власних plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста пам’яті | Експорти рушія QMD хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам’яті | Експорти рушія сховища хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні помічники хоста пам’яті | Мультимодальні помічники хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Помічники запитів хоста пам’яті | Помічники запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Помічники секретів хоста пам’яті | Помічники секретів хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Помічники журналу подій хоста пам’яті | Помічники журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Помічники статусу хоста пам’яті | Помічники статусу хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста пам’яті | CLI runtime-помічники хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime хоста пам’яті | Core runtime-помічники хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Помічники файлів/runtime хоста пам’яті | Помічники файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім core runtime хоста пам’яті | Vendor-neutral псевдонім для core runtime-помічників хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Vendor-neutral псевдонім для помічників журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime хоста пам’яті | Vendor-neutral псевдонім для помічників файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Помічники керованого Markdown | Спільні помічники managed-markdown для суміжних із пам’яттю plugins |
  | `plugin-sdk/memory-host-search` | Фасад пошуку active memory | Лінивий runtime-фасад search-manager active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу хоста пам’яті | Vendor-neutral псевдонім для помічників статусу хоста пам’яті |
  | `plugin-sdk/testing` | Тестові утиліти | Застарілий широкий barrel сумісності; надавайте перевагу сфокусованим тестовим підшляхам, як-от `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно містить спільну підмножину для міграції, а не повну
поверхню SDK. Повний список із 200+ точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні межі вбудованих Plugin вилучено з карти експортів
публічного SDK, окрім явно задокументованих фасадів сумісності, як-от
застарілий shim `plugin-sdk/discord`, збережений для опублікованого пакета
`@openclaw/discord@2026.3.13`. Специфічні для власника допоміжні засоби
містяться всередині пакета Plugin, якому вони належать; спільна поведінка хоста
має проходити через загальні контракти SDK, як-от
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` і
`plugin-sdk/plugin-config-runtime`.

Використовуйте найвужчий імпорт, що відповідає завданню. Якщо не можете знайти
експорт, перевірте джерело в `src/plugin-sdk/` або запитайте супровідників, який
загальний контракт має ним володіти.

## Активні застарілі елементи

Вужчі застарілі елементи, що застосовуються до plugin SDK, контракту
провайдера, runtime-поверхні та маніфесту. Кожен із них усе ще працює сьогодні,
але буде вилучений у майбутньому мажорному випуску. Запис під кожним елементом
зіставляє старий API з його канонічною заміною.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — просто імпортовані з вужчого підшляху. `command-auth`
    реекспортує їх як сумісні заглушки.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    єдиний об’єкт рішення замість двох окремих викликів.

    Нижчі за ланцюжком channel plugins (Slack, Discord, Matrix, MS Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` є shim сумісності для старіших
    channel plugins. Не імпортуйте його з нового коду; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації runtime-об’єктів.

    Допоміжні засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions`
    застаріли разом із raw-експортами channel "actions". Натомість виставляйте
    можливості через семантичну поверхню `presentation` — channel plugins
    оголошують, що вони рендерять (картки, кнопки, випадаючі списки), а не які
    raw-назви дій вони приймають.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в provider plugin.
    OpenClaw більше не потребує допоміжного засобу SDK для реєстрації обгортки
    інструмента.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для створення плаского plaintext
    prompt envelope з вхідних channel-повідомлень.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача.
    Channel plugins додають routing-метадані (thread, topic, reply-to, reactions)
    як типізовані поля замість конкатенації їх у prompt-рядок. Допоміжний засіб
    `formatAgentEnvelope(...)` усе ще підтримується для синтезованих envelope,
    звернених до assistant, але вхідні plaintext envelopes поступово виводяться.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який
    користувацький channel plugin, який постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    Чотири псевдоніми типів discovery тепер є тонкими обгортками над типами
    catalog-era:

    | Старий псевдонім          | Новий тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс застарілий статичний набір `ProviderCapabilities` — provider plugins
    мають використовувати явні provider hooks, як-от `buildReplayPolicy`,
    `normalizeToolSchemas` і `wrapStreamFn`, замість статичного об’єкта.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Старе** (три окремі hooks у `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: єдиний `resolveThinkingProfile(ctx)`, що повертає
    `ProviderThinkingProfile` з канонічним `id`, необов’язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично понижує застарілі збережені
    значення за рангом профілю.

    Реалізуйте один hook замість трьох. Застарілі hooks працюють протягом вікна
    застарівання, але не компонуються з результатом профілю.

  </Accordion>

  <Accordion title="External OAuth provider fallback → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без оголошення
    провайдера в маніфесті Plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті Plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях "auth
    fallback" видає попередження під час виконання й буде вилучений.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **Старе** поле маніфесту: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: віддзеркальте той самий пошук env-var у `setup.providers[].envVars`
    у маніфесті. Це об’єднує env-метадані setup/status в одному місці й уникає
    запуску runtime Plugin лише для відповіді на env-var lookup.

    `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності,
    доки не завершиться вікно застарівання.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик в API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Додаткові допоміжні засоби пам’яті
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачеплені.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    Два застарілі псевдоніми типів досі експортуються з `src/plugins/runtime/types.ts`:

    | Старе                         | Нове                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Runtime-метод `readSession` застарів на користь `getSessionMessages`. Та сама
    сигнатура; старий метод викликає новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Старе**: `runtime.tasks.flow` (однина) повертав live-аксесор task-flow.

    **Нове**: `runtime.tasks.managedFlows` зберігає managed TaskFlow mutation
    runtime для plugins, які створюють, оновлюють, скасовують або запускають
    дочірні завдання з flow. Використовуйте `runtime.tasks.flows`, коли Plugin
    потребує лише DTO-based читання.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    Розглянуто вище в "Як мігрувати → Мігруйте розширення Pi tool-result на
    middleware". Додано тут для повноти: вилучений шлях лише для Pi
    `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime у
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `OpenClawSchemaType`, реекспортований з `openclaw/plugin-sdk`, тепер є
    однорядковим псевдонімом для `OpenClawConfig`. Надавайте перевагу
    канонічній назві.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Застарілі елементи рівня Plugin (всередині вбудованих channel/provider plugins
у `extensions/`) відстежуються у власних barrel-файлах `api.ts` і
`runtime-api.ts`. Вони не впливають на контракти сторонніх plugins і не
перелічені тут. Якщо ви напряму використовуєте локальний barrel вбудованого
Plugin, перед оновленням прочитайте коментарі про застарівання в цьому barrel.
</Note>

## Графік вилучення

| Коли                   | Що відбувається                                                        |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні видають runtime-попередження                         |
| **Наступний мажорний випуск** | Застарілі поверхні буде вилучено; plugins, які досі їх використовують, не працюватимуть |

Усі core plugins уже мігровано. Зовнішні plugins мають мігрувати до наступного
мажорного випуску.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий аварійний обхід, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення channel plugins
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення provider plugins
- [Внутрішня будова Plugin](/uk/plugins/architecture) — поглиблений огляд архітектури
- [Маніфест Plugin](/uk/plugins/manifest) — довідник схеми маніфесту
