---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували `api.registerEmbeddedExtensionFactory` до OpenClaw 2026.4.24
    - Ви оновлюєте Plugin до сучасної архітектури Plugin
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-25T02:02:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6944e81e02d0e4031090a1b557e58842c59046f5e0c3834d7079c6370b4cb45c
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури Plugin із цільовими, задокументованими імпортами. Якщо ваш Plugin було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система Plugin надавала дві широкі поверхні, які дозволяли Plugin імпортувати все необхідне з єдиної точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який повторно експортував десятки допоміжних засобів. Його було запроваджено, щоб старіші Plugins на основі хуків продовжували працювати, поки створювалася нова архітектура Plugin.
- **`openclaw/extension-api`** — міст, який надавав Plugins прямий доступ до допоміжних засобів на боці хоста, таких як вбудований виконавець агента.
- **`api.registerEmbeddedExtensionFactory(...)`** — вилучений API-хук для вбудованих розширень лише для Pi, який міг спостерігати за подіями вбудованого виконавця, такими як `tool_result`.

Ці широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють під час виконання, але нові Plugins не повинні їх використовувати, а наявні Plugins мають перейти на новий підхід до того, як у наступному мажорному релізі їх буде вилучено. API реєстрації фабрики вбудованого розширення лише для Pi вилучено; натомість використовуйте проміжне ПЗ результатів інструментів.

OpenClaw не вилучає і не переосмислює задокументовану поведінку Plugin у тій самій зміні, яка запроваджує заміну. Зміни контрактів, що ламають сумісність, спочатку мають пройти через адаптер сумісності, діагностику, документацію та вікно застарівання. Це стосується імпортів SDK, полів маніфесту, API налаштування, хуків і поведінки реєстрації під час виконання.

<Warning>
  Шар зворотної сумісності буде вилучено в одному з майбутніх мажорних релізів.
  Plugins, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
  Реєстрації фабрики вбудованого розширення лише для Pi уже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного допоміжного засобу завантажував десятки не пов’язаних між собою модулів
- **Циклічні залежності** — широкі повторні експорти полегшували створення циклів імпорту
- **Неясна поверхня API** — не було способу зрозуміти, які експорти є стабільними, а які внутрішніми

Сучасний Plugin SDK це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`) — це невеликий самодостатній модуль із чітким призначенням і задокументованим контрактом.

Застарілі зручні шви провайдерів для вбудованих каналів також вилучено. Імпорти
на кшталт `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
допоміжні шви з брендуванням каналу та
`openclaw/plugin-sdk/telegram-core` були внутрішніми скороченнями mono-repo, а не
стабільними контрактами Plugin. Натомість використовуйте вузькі загальні підшляхи SDK. Усередині робочого простору вбудованого Plugin зберігайте допоміжні засоби, що належать провайдеру, у власному `api.ts` або `runtime-api.ts` цього Plugin.

Поточні приклади вбудованих провайдерів:

- Anthropic зберігає допоміжні засоби потоків, специфічні для Claude, у власному шві `api.ts` /
  `contract-api.ts`
- OpenAI зберігає конструктори провайдера, допоміжні засоби моделей за замовчуванням і конструктори провайдера realtime
  у власному `api.ts`
- OpenRouter зберігає конструктор провайдера та допоміжні засоби онбордингу/конфігурації у власному
  `api.ts`

## Політика сумісності

Для зовнішніх Plugins робота із сумісністю відбувається в такому порядку:

1. додати новий контракт
2. зберегти стару поведінку через адаптер сумісності
3. вивести діагностичне повідомлення або попередження, у якому вказано старий шлях і заміну
4. покрити обидва шляхи в тестах
5. задокументувати застарівання та шлях міграції
6. вилучати лише після оголошеного вікна міграції, зазвичай у мажорному релізі

Якщо поле маніфесту все ще приймається, автори Plugin можуть і надалі його використовувати, доки документація й діагностика не скажуть інакше. Новий код має надавати перевагу задокументованій заміні, але наявні Plugins не повинні ламатися під час звичайних мінорних релізів.

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть розширення результатів інструментів Pi на проміжне ПЗ">
    Вбудовані Plugins мають замінити обробники результатів інструментів лише для Pi в
    `api.registerEmbeddedExtensionFactory(...)`
    на нейтральне до середовища виконання проміжне ПЗ.

    ```typescript
    // Pi and Codex runtime dynamic tools
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

    Зовнішні Plugins не можуть реєструвати проміжне ПЗ результатів інструментів, оскільки воно може
    переписувати вихідні дані інструментів із високим рівнем довіри до того, як модель їх побачить.

  </Step>

  <Step title="Перенесіть обробники з рідною підтримкою схвалення на факти можливостей">
    Plugins каналів із підтримкою схвалення тепер надають рідну поведінку схвалення через
    `approvalCapability.nativeRuntime` разом зі спільним реєстром контексту середовища виконання.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть специфічні для схвалення auth/доставку зі застарілої прив’язки `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` вилучено з публічного контракту Plugin каналу;
      перенесіть поля delivery/native/render у `approvalCapability`
    - `plugin.auth` залишається лише для потоків login/logout каналу; auth-хуки схвалення
      там більше не зчитуються ядром
    - Реєструйте об’єкти середовища виконання, що належать каналу, такі як clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте повідомлення про перенаправлення, що належать Plugin, із рідних обробників схвалення;
      ядро тепер саме володіє повідомленнями «перенаправлено в інше місце» на основі фактичних результатів доставки
    - Під час передавання `channelRuntime` у `createChannelManager(...)` надавайте
      справжню поверхню `createPluginRuntime().channel`. Часткові заглушки відхиляються.

    Актуальну структуру можливостей схвалення див. у `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Перевірте резервну поведінку обгортки Windows">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, невизначені обгортки Windows
    `.cmd`/`.bat` тепер завершуються із закритою відмовою, якщо ви явно не передасте `allowShellFallback: true`.

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

    Якщо ваш викликаючий код не покладається навмисно на резервний shell-виклик, не встановлюйте
    `allowShellFallback`, а натомість обробляйте викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у своєму Plugin імпорти з будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть цільовими імпортами">
    Кожен експорт зі старої поверхні відповідає певному сучасному шляху імпорту:

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

    Для допоміжних засобів на боці хоста використовуйте впроваджене середовище виконання Plugin замість
    прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Такий самий шаблон застосовується до інших допоміжних засобів застарілого мосту:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

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
  | Import path | Призначення | Ключові експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний засіб точки входу Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий парасольковий повторний експорт для визначень/конструкторів точок входу каналів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб точки входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цільові визначення та конструктори точок входу каналів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Підказки allowlist, конструктори статусу налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби середовища виконання для етапу налаштування | Безпечні для імпорту адаптери патчів налаштування, допоміжні засоби приміток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку/конфігурації/обмеження дій облікових записів |
  | `plugin-sdk/account-id` | Допоміжні засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікових записів | Допоміжні засоби пошуку облікових записів + резервного вибору за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для облікових записів | Допоміжні засоби списку облікових записів/дій облікового запису |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви pairing для DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Підключення префікса відповіді + введення тексту | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Конструктори схем конфігурації | Спільні примітиви схем конфігурації каналів; експортовані схеми з іменами вбудованих каналів є лише застарілою сумісністю |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація назв команд, обрізання опису, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Допоміжні засоби статусу облікових записів і життєвого циклу потоків чернеток | `createAccountStatusSink`, допоміжні засоби фіналізації попереднього перегляду чернетки |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби вхідних envelope | Спільні допоміжні засоби маршрутизації + побудови envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби вхідних відповідей | Спільні допоміжні засоби запису та диспетчеризації |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Допоміжні засоби розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідного середовища виконання | Допоміжні засоби вихідної доставки, delegate ідентичності/надсилання, сесії, форматування та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби thread-binding | Допоміжні засоби життєвого циклу та адаптера thread-binding |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби payload медіа агента | Конструктор payload медіа агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти середовища виконання каналу |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби середовища виконання | Допоміжні засоби середовища виконання/логування/резервного копіювання/встановлення Plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби env середовища виконання | Logger/env середовища виконання, допоміжні засоби timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби середовища виконання Plugin | Допоміжні засоби команд/хуків/http/інтерактивної взаємодії Plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра хуків | Спільні допоміжні засоби конвеєра Webhook/внутрішніх хуків |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби середовища виконання CLI | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Клієнт Gateway і допоміжні засоби патчів статусу каналу |
  | `plugin-sdk/config-runtime` | Допоміжні засоби конфігурації | Допоміжні засоби завантаження/запису конфігурації |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Стабільні резервні допоміжні засоби перевірки команд Telegram, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби запитів на схвалення | Допоміжні засоби payload схвалення exec/Plugin, допоміжні засоби capability/profile схвалення, допоміжні засоби маршрутизації/середовища виконання рідного схвалення та форматування структурованого шляху відображення схвалення |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби auth схвалення | Визначення approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта схвалення | Допоміжні засоби профілю/фільтра рідного схвалення exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки схвалення | Адаптери capability/доставки рідного схвалення |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби Gateway схвалення | Спільний допоміжний засіб визначення Gateway схвалення |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера схвалення | Легковагові допоміжні засоби завантаження адаптера рідного схвалення для гарячих точок входу каналу |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника схвалення | Ширші допоміжні засоби середовища виконання обробника схвалення; надавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілей схвалення | Допоміжні засоби прив’язки цілей/облікових записів рідного схвалення |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповідей на схвалення | Допоміжні засоби payload відповіді на схвалення exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби runtime-context каналу | Загальні допоміжні засоби register/get/watch для runtime-context каналу |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби trust, DM gating, external-content і збору секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби середовища виконання SSRF | Допоміжні засоби pinned-dispatcher, guarded fetch, політики SSRF |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби керування діагностикою | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Обгорнуті допоміжні засоби fetch/proxy | `resolveFetch`, допоміжні засоби proxy |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби retry | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення вхідних даних allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Керування командами та допоміжні засоби поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд |
  | `plugin-sdk/command-status` | Засоби відображення статусу/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір секретного вводу | Допоміжні засоби секретного вводу |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби guard для тіла запиту Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільне середовище виконання відповідей | Вхідна диспетчеризація, Heartbeat, planner відповідей, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації відповідей | Допоміжні засоби finalize, dispatch провайдера та міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби фрагментації відповідей | Допоміжні засоби chunking тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій | Допоміжні засоби шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів state і OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби маршрутизації/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації session-key |
  | `plugin-sdk/status-helpers` | Допоміжні засоби статусу каналу | Конструктори підсумків статусу каналу/облікового запису, значення runtime-state за замовчуванням, допоміжні засоби метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби визначення цілі | Спільні допоміжні засоби визначення цілі |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запитів | Витягування рядкових URL з об’єктів, подібних до запитів |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із таймерами | Виконавець команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Поширені зчитувачі параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload tool | Витягування нормалізованих payload з об’єктів результатів інструментів |
  | `plugin-sdk/tool-send` | Витягування надсилання tool | Витягування канонічних полів цілі надсилання з аргументів tool |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби тимчасових шляхів завантаження |
  | `plugin-sdk/logging-core` | Допоміжні засоби логування | Допоміжні засоби logger підсистем і редагування |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби markdown-таблиць | Допоміжні засоби режимів markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи відповідей повідомлень | Типи payload відповідей |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локального/self-hosted провайдера | Допоміжні засоби виявлення/конфігурації self-hosted провайдерів |
  | `plugin-sdk/self-hosted-provider-setup` | Цільові допоміжні засоби налаштування self-hosted провайдера, сумісного з OpenAI | Ті самі допоміжні засоби виявлення/конфігурації self-hosted провайдерів |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби auth середовища виконання провайдера | Допоміжні засоби визначення API-ключів під час виконання |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключа провайдера | Допоміжні засоби онбордингу/запису профілю API-ключа |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби результатів auth провайдера | Стандартний конструктор auth-result OAuth |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного login провайдера | Спільні допоміжні засоби інтерактивного login |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору провайдера | Допоміжні засоби вибору налаштованого або автоматичного провайдера та злиття сирої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env-var провайдера | Допоміжні засоби пошуку env-var auth провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделей/replay провайдерів | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори replay-policy, допоміжні засоби endpoint провайдерів і допоміжні засоби нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу провайдерів | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу провайдера | Допоміжні засоби конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP провайдера | Загальні допоміжні засоби HTTP/endpoint capability провайдера, зокрема допоміжні засоби multipart form для транскрибування аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch провайдера | Допоміжні засоби реєстрації/кешу провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації web-search провайдера | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення enable Plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту web-search провайдера | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setters/getters облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search провайдера | Допоміжні засоби реєстрації/кешу/середовища виконання провайдера web-search |
  | `plugin-sdk/provider-tools` | Допоміжні засоби compat tool/schema провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, cleanup + diagnostics схеми Gemini і допоміжні засоби compat xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби usage провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби usage провайдера |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгортки stream провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток stream і спільні допоміжні засоби обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби транспорту провайдера | Рідні допоміжні засоби транспорту провайдера, такі як guarded fetch, transforms повідомлень транспорту та writable event streams транспорту |
  | `plugin-sdk/keyed-async-queue` | Упорядкована async-черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби медіа | Допоміжні засоби fetch/transform/store для медіа, а також конструктори media payload |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації медіа | Спільні допоміжні засоби failover, вибору candidate та повідомлень про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби media-understanding | Типи провайдерів media understanding, а також експортовані допоміжні засоби зображень/аудіо для провайдерів |
  | `plugin-sdk/text-runtime` | Спільні допоміжні засоби тексту | Видалення видимого для асистента тексту, допоміжні засоби render/chunking/table для markdown, допоміжні засоби редагування, допоміжні засоби directive-tag, safe-text utilities і пов’язані допоміжні засоби тексту/логування |
  | `plugin-sdk/text-chunking` | Допоміжні засоби фрагментації тексту | Допоміжний засіб chunking вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні засоби мовлення | Типи провайдерів мовлення, а також допоміжні засоби directive, registry і validation для провайдерів |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдерів мовлення, registry, directives, normalізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрибування в realtime | Типи провайдерів, допоміжні засоби registry і спільний допоміжний засіб сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу в realtime | Типи провайдерів, допоміжні засоби registry/resolution і допоміжні засоби bridge session |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, допоміжні засоби failover, auth і registry |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи провайдерів/запитів/результатів генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби failover, пошук провайдера та парсинг model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи провайдерів/запитів/результатів генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби failover, пошук провайдера та парсинг model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивних відповідей | Нормалізація/редукція payload інтерактивних відповідей |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви channel config-schema |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації каналу | Допоміжні засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільний прелюд каналу | Експорти спільного прелюду Plugin каналу |
  | `plugin-sdk/channel-status` | Допоміжні засоби статусу каналу | Спільні допоміжні засоби snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації allowlist | Допоміжні засоби редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби доступу до груп | Спільні допоміжні засоби рішень щодо group-access |
  | `plugin-sdk/direct-dm` | Допоміжні засоби direct-DM | Спільні допоміжні засоби auth/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби розширень | Примітиви допоміжних засобів passive-channel/status і ambient proxy |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляхів Webhook | Допоміжні засоби нормалізації шляхів Webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби вебмедіа | Допоміжні засоби завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів Plugin SDK |
  | `plugin-sdk/memory-core` | Допоміжні засоби вбудованого memory-core | Поверхня допоміжних засобів менеджера/config/file/CLI пам’яті |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад середовища виконання рушія пам’яті | Фасад середовища виконання індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій хоста пам’яті | Експорти базового рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embedding хоста пам’яті | Контракти embedding пам’яті, доступ до registry, локальний провайдер і загальні допоміжні засоби batch/remote; конкретні remote-провайдери живуть у Plugins, яким вони належать |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста пам’яті | Експорти рушія QMD хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам’яті | Експорти рушія сховища хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Допоміжні засоби multimodal хоста пам’яті | Допоміжні засоби multimodal хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті | Допоміжні засоби запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті | Допоміжні засоби секретів хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті | Допоміжні засоби журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті | Допоміжні засоби статусу хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI середовища виконання хоста пам’яті | Допоміжні засоби CLI середовища виконання хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Основне середовище виконання хоста пам’яті | Допоміжні засоби основного середовища виконання хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/середовища виконання хоста пам’яті | Допоміжні засоби файлів/середовища виконання хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім основного середовища виконання хоста пам’яті | Нейтральний до постачальника псевдонім для допоміжних засобів основного середовища виконання хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Нейтральний до постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/середовища виконання хоста пам’яті | Нейтральний до постачальника псевдонім для допоміжних засобів файлів/середовища виконання хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого markdown | Спільні допоміжні засоби керованого markdown для Plugins, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Lazy фасад середовища виконання search-manager для active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу хоста пам’яті | Нейтральний до постачальника псевдонім для допоміжних засобів статусу хоста пам’яті |
  | `plugin-sdk/memory-lancedb` | Допоміжні засоби вбудованого memory-lancedb | Поверхня допоміжних засобів memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Допоміжні засоби тестування та mock-об’єкти |
</Accordion>

Ця таблиця навмисно містить поширену підмножину для міграції, а не всю
поверхню SDK. Повний список із понад 200 точок входу міститься у
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще містить деякі шви допоміжних засобів вбудованих Plugins, як-от
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
підтримки та сумісності вбудованих Plugins, але навмисно не включені до
поширеної таблиці міграції та не є рекомендованою ціллю для
нового коду Plugin.

Те саме правило застосовується до інших сімейств вбудованих допоміжних засобів, таких як:

- допоміжні засоби підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні вбудованих допоміжних засобів/Plugins, як-от `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` зараз надає вузьку
поверхню допоміжних засобів токенів `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти експорт,
перевірте вихідний код у `src/plugin-sdk/` або запитайте в Discord.

## Активні застарівання

Вужчі застарівання, які застосовуються в усьому Plugin SDK, контракті провайдера,
поверхні середовища виконання та маніфесті. Кожен із них і далі працює сьогодні, але буде
вилучений у майбутньому мажорному релізі. Запис під кожним елементом зіставляє старий API
із його канонічною заміною.

<AccordionGroup>
  <Accordion title="Засоби побудови довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — лише імпортовані з вужчого підшляху. `command-auth`
    повторно експортує їх як compat-заглушки.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Допоміжні засоби gating згадок → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    єдиний об’єкт рішення замість двох розділених викликів.

    Downstream Plugins каналів (Slack, Discord, Matrix, MS Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Shim середовища виконання каналу та допоміжні засоби дій каналу">
    `openclaw/plugin-sdk/channel-runtime` — це compat-shim для старіших
    Plugins каналів. Не імпортуйте його в новому коді; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації об’єктів
    середовища виконання.

    Допоміжні засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions` є
    застарілими разом із сирими експортами каналу "actions". Натомість
    надавайте можливості через семантичну поверхню `presentation` — Plugins каналів
    оголошують, що саме вони відображають (cards, buttons, selects), а не які сирі
    назви actions вони приймають.

  </Accordion>

  <Accordion title="Допоміжний засіб tool() провайдера web search → createTool() у Plugin">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в Plugin провайдера.
    OpenClaw більше не потребує допоміжного засобу SDK для реєстрації обгортки tool.

  </Accordion>

  <Accordion title="Текстові channel envelope у відкритому вигляді → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плоского текстового prompt
    envelope із вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача. Plugins
    каналів додають метадані маршрутизації (thread, topic, reply-to, reactions) як
    типізовані поля замість конкатенації їх у рядок prompt. Допоміжний засіб
    `formatAgentEnvelope(...)` і далі підтримується для синтезованих envelope,
    видимих асистенту, але вхідні текстові envelope уже
    поступово виводяться з ужитку.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який користувацький
    Plugin каналу, який виконував постобробку тексту `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи виявлення провайдерів → типи каталогу провайдерів">
    Чотири псевдоніми типів виявлення тепер є тонкими обгортками над
    типами епохи каталогу:

    | Старий псевдонім         | Новий тип                |
    | ------------------------ | ------------------------ |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    А також застарілий статичний набір `ProviderCapabilities` — Plugins провайдерів
    мають приєднувати факти можливостей через контракт середовища виконання провайдера,
    а не через статичний об’єкт.

  </Accordion>

  <Accordion title="Хуки політики thinking → resolveThinkingProfile">
    **Старе** (три окремі хуки в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: єдиний `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` із канонічним `id`, необов’язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично знижує застарілі збережені
    значення за рангом профілю.

    Реалізуйте один хук замість трьох. Застарілі хуки продовжують працювати протягом
    вікна застарівання, але не поєднуються з результатом профілю.

  </Accordion>

  <Accordion title="Резервний шлях зовнішнього OAuth провайдера → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення провайдера в маніфесті Plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті Plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях "auth
    fallback" виводить попередження під час виконання й буде вилучений.

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

    **Нове**: віддзеркальте той самий пошук env-var у `setup.providers[].envVars`
    маніфесту. Це об’єднує метадані env налаштування/статусу в одному
    місці та дає змогу уникнути запуску середовища виконання Plugin лише для відповіді на
    запити пошуку env-var.

    `providerAuthEnvVars` і далі підтримується через адаптер сумісності
    до завершення вікна застарівання.

  </Accordion>

  <Accordion title="Реєстрація Plugin пам’яті → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик у API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Адитивні допоміжні засоби пам’яті
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) це не зачіпає.

  </Accordion>

  <Accordion title="Типи повідомлень сесії subagent перейменовано">
    Два застарілі псевдоніми типів усе ще експортуються з `src/plugins/runtime/types.ts`:

    | Старе                       | Нове                            |
    | --------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Метод середовища виконання `readSession` є застарілим на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає
    новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Старе**: `runtime.tasks.flow` (в однині) повертав живий accessor TaskFlow.

    **Нове**: `runtime.tasks.flows` (у множині) повертає DTO-based доступ до TaskFlow,
    який є безпечним для імпорту і не потребує завантаження повного середовища виконання задач.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Фабрики вбудованих розширень → проміжне ПЗ результатів інструментів агента">
    Це описано вище в розділі "Як виконати міграцію → Перенесіть розширення результатів інструментів Pi на
    проміжне ПЗ". Для повноти тут також зазначено: вилучений шлях лише для Pi
    `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком середовищ виконання
    у `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Псевдонім OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, який повторно експортується з `openclaw/plugin-sdk`, тепер є
    однорядковим псевдонімом для `OpenClawConfig`. Надавайте перевагу канонічній назві.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Застарівання на рівні розширень (усередині вбудованих Plugins каналів/провайдерів у
`extensions/`) відстежуються у їхніх власних barrel-файлах `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх Plugins і тут не перелічені.
Якщо ви напряму споживаєте локальний barrel вбудованого Plugin, перед
оновленням прочитайте коментарі щодо застарівання в цьому barrel.
</Note>

## Хронологія вилучення

| Коли                   | Що відбувається                                                          |
| ---------------------- | ------------------------------------------------------------------------ |
| **Зараз**              | Застарілі поверхні виводять попередження під час виконання               |
| **Наступний мажорний реліз** | Застарілі поверхні буде вилучено; Plugins, які все ще їх використовують, завершаться з помилкою |

Усі core Plugins уже перенесено. Зовнішнім Plugins слід виконати міграцію
до наступного мажорного релізу.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний механізм, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [Plugins каналів](/uk/plugins/sdk-channel-plugins) — створення Plugins каналів
- [Plugins провайдерів](/uk/plugins/sdk-provider-plugins) — створення Plugins провайдерів
- [Внутрішня будова Plugin](/uk/plugins/architecture) — глибокий огляд архітектури
- [Маніфест Plugin](/uk/plugins/manifest) — довідник схеми маніфесту
