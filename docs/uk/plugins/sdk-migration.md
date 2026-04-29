---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували api.registerEmbeddedExtensionFactory до версії OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури Plugin
    - Ви підтримуєте зовнішній Plugin для OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний SDK Plugin
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-29T04:06:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9988b83466fa2c38511e2ca6eefa85108266b0d929e223ed5849921b956ac80
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури плагінів із цілеспрямованими, задокументованими імпортами. Якщо ваш плагін було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система плагінів надавала дві широкі відкриті поверхні, які дозволяли плагінам імпортувати все потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який повторно експортував десятки допоміжних засобів. Його було запроваджено, щоб старі плагіни на основі хуків продовжували працювати, поки створювалася нова архітектура плагінів.
- **`openclaw/plugin-sdk/infra-runtime`** — широкий барель допоміжних засобів виконання, який змішував системні події, стан Heartbeat, черги доставки, допоміжні засоби fetch/proxy, файлові допоміжні засоби, типи схвалень і не пов’язані між собою утиліти.
- **`openclaw/plugin-sdk/config-runtime`** — широкий барель сумісності конфігурації, який під час вікна міграції досі містить застарілі прямі допоміжні засоби завантаження/запису.
- **`openclaw/extension-api`** — міст, який надавав плагінам прямий доступ до допоміжних засобів на боці хоста, як-от вбудований виконувач агента.
- **`api.registerEmbeddedExtensionFactory(...)`** — вилучений хук лише для Pi, призначений для вбудованого розширення в комплекті, який міг спостерігати за подіями вбудованого виконувача, такими як `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони досі працюють під час виконання, але нові плагіни не повинні їх використовувати, а наявні плагіни мають мігрувати до того, як наступний основний випуск їх вилучить. API реєстрації фабрики вбудованого розширення лише для Pi було вилучено; натомість використовуйте middleware результатів інструментів.

OpenClaw не вилучає й не переінтерпретовує задокументовану поведінку плагінів у тій самій зміні, яка вводить заміну. Зміни контракту, що порушують сумісність, спершу мають пройти через адаптер сумісності, діагностику, документацію та вікно застарівання. Це стосується імпортів SDK, полів маніфесту, API налаштування, хуків і поведінки реєстрації під час виконання.

<Warning>
  Шар зворотної сумісності буде вилучено в майбутньому основному випуску.
  Плагіни, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
  Реєстрації фабрик вбудованих розширень лише для Pi вже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного допоміжного засобу завантажував десятки не пов’язаних між собою модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Нечітка поверхня API** — не було способу визначити, які експорти стабільні, а які внутрішні

Сучасний SDK плагінів виправляє це: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`) є невеликим самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі зручні точки інтеграції провайдерів для каналів у комплекті також вилучено.
Допоміжні точки інтеграції з брендингом каналів були приватними скороченнями монорепозиторію, а не стабільними контрактами плагінів. Натомість використовуйте вузькі узагальнені підшляхи SDK. Усередині робочої області плагіна в комплекті тримайте допоміжні засоби, що належать провайдеру, у власному `api.ts` або `runtime-api.ts` цього плагіна.

Поточні приклади провайдерів у комплекті:

- Anthropic зберігає допоміжні засоби потоків, специфічні для Claude, у власній точці інтеграції `api.ts` / `contract-api.ts`
- OpenAI зберігає побудовники провайдерів, допоміжні засоби моделей за замовчуванням і побудовники провайдерів реального часу у власному `api.ts`
- OpenRouter зберігає побудовник провайдера та допоміжні засоби онбордингу/конфігурації у власному `api.ts`

## Політика сумісності

Для зовнішніх плагінів робота із сумісністю відбувається в такому порядку:

1. додати новий контракт
2. зберегти стару поведінку, підключену через адаптер сумісності
3. виводити діагностику або попередження, яке називає старий шлях і заміну
4. покрити обидва шляхи тестами
5. задокументувати застарівання та шлях міграції
6. вилучати лише після оголошеного вікна міграції, зазвичай в основному випуску

Супровідники можуть перевіряти поточну чергу міграції за допомогою `pnpm plugins:boundary-report`. Використовуйте `pnpm plugins:boundary-report:summary` для компактних підрахунків, `--owner <id>` для одного плагіна або власника сумісності та `pnpm plugins:boundary-report:ci`, коли CI-гейт має падати через записи сумісності з простроченим терміном, зарезервовані імпорти SDK між власниками або невикористані зарезервовані підшляхи SDK. Звіт групує застарілі записи сумісності за датою вилучення, підраховує локальні посилання в коді/документації, показує зарезервовані імпорти SDK між власниками та підсумовує приватний SDK-міст memory-host, щоб очищення сумісності залишалося явним, а не спиралося на випадкові пошуки. Зарезервовані підшляхи SDK повинні мати відстежене використання власником; невикористані зарезервовані допоміжні експорти слід вилучити з публічного SDK.

Якщо поле маніфесту досі приймається, автори плагінів можуть продовжувати його використовувати, доки документація та діагностика не скажуть інше. Новий код має надавати перевагу задокументованій заміні, але наявні плагіни не повинні ламатися під час звичайних мінорних випусків.

## Як мігрувати

<Steps>
  <Step title="Мігруйте допоміжні засоби завантаження/запису runtime-конфігурації">
    Плагіни в комплекті мають припинити напряму викликати
    `api.runtime.config.loadConfig()` та
    `api.runtime.config.writeConfigFile(...)`. Надавайте перевагу конфігурації, яку вже передано в активний шлях виклику. Довготривалі обробники, яким потрібен поточний знімок процесу, можуть використовувати `api.runtime.config.current()`. Довготривалі агентні інструменти мають використовувати `ctx.getRuntimeConfig()` з контексту інструмента всередині
    `execute`, щоб інструмент, створений до запису конфігурації, все одно бачив оновлену runtime-конфігурацію.

    Записи конфігурації мають проходити через транзакційні допоміжні засоби й вибирати політику після запису:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Використовуйте `afterWrite: { mode: "restart", reason: "..." }`, коли викликач знає, що зміна потребує чистого перезапуску Gateway, і
    `afterWrite: { mode: "none", reason: "..." }` лише тоді, коли викликач володіє подальшою дією та навмисно хоче приглушити планувальник перезавантаження.
    Результати мутації містять типізований підсумок `followUp` для тестів і журналювання;
    Gateway залишається відповідальним за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються застарілими допоміжними засобами сумісності для зовнішніх плагінів під час вікна міграції та один раз попереджають із кодом сумісності `runtime-config-load-write`. Плагіни в комплекті та runtime-код репозиторію захищені запобіжниками сканера в
    `pnpm check:deprecated-internal-config-api` та
    `pnpm check:no-runtime-action-load-config`: нове використання у виробничих плагінах одразу завершується помилкою, прямі записи конфігурації завершуються помилкою, методи сервера Gateway мають використовувати runtime-знімок запиту, runtime-допоміжні засоби надсилання/дії/клієнта каналу мають отримувати конфігурацію зі своєї межі, а довготривалі runtime-модулі мають нуль дозволених фонових викликів `loadConfig()`.

    Новий код плагінів також має уникати імпорту широкого бареля сумісності
    `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький підшлях SDK, який відповідає завданню:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, такі як `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Перевірки вже завантаженої конфігурації та пошук конфігурації точки входу плагіна | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного runtime-знімка | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Допоміжні засоби сховища сесій | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація таблиць Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime-допоміжні засоби групової політики | `openclaw/plugin-sdk/runtime-group-policy` |
    | Розв’язання секретного введення | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення моделей/сесій | `openclaw/plugin-sdk/model-session-runtime` |

    Плагіни в комплекті та їхні тести захищені сканером від широкого бареля, щоб імпорти й моки залишалися локальними до потрібної їм поведінки. Широкий барель досі існує для зовнішньої сумісності, але новий код не повинен від нього залежати.

  </Step>

  <Step title="Мігруйте Pi-розширення результатів інструментів на middleware">
    Плагіни в комплекті мають замінити обробники результатів інструментів
    `api.registerEmbeddedExtensionFactory(...)` лише для Pi на runtime-нейтральне middleware.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Одночасно оновіть маніфест плагіна:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Зовнішні плагіни не можуть реєструвати middleware результатів інструментів, бо воно може переписувати вихідні дані інструментів із високим рівнем довіри до того, як модель їх побачить.

  </Step>

  <Step title="Мігруйте обробники з нативним схваленням на факти можливостей">
    Плагіни каналів із підтримкою схвалень тепер надають нативну поведінку схвалень через
    `approvalCapability.nativeRuntime` плюс спільний реєстр runtime-контексту.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть специфічну для схвалень автентифікацію/доставку зі старого зв’язування `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` вилучено з публічного контракту плагіна каналу; перенесіть поля доставки/нативного виконання/рендерингу на `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу з каналу; хуки автентифікації схвалень там більше не читаються ядром
    - Реєструйте runtime-об’єкти, що належать каналу, як-от клієнти, токени або застосунки Bolt, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте повідомлення про перенаправлення, що належать плагіну, з нативних обробників схвалень;
      ядро тепер володіє повідомленнями про доставку в інше місце на основі фактичних результатів доставки
    - Передаючи `channelRuntime` у `createChannelManager(...)`, надавайте справжню поверхню `createPluginRuntime().channel`. Часткові заглушки відхиляються.

    Див. `/plugins/sdk-channel-plugins` для поточного компонування можливості схвалень.

  </Step>

  <Step title="Перевірте fallback-поведінку Windows-обгорток">
    Якщо ваш плагін використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані Windows-обгортки
    `.cmd`/`.bat` тепер закриваються з помилкою, якщо ви явно не передасте
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

    Якщо ваш викликач не покладається навмисно на shell fallback, не встановлюйте
    `allowShellFallback` і натомість обробіть викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Пошукайте у своєму плагіні імпорти з будь-якої застарілої поверхні:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на цілеспрямовані імпорти">
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

    Для допоміжних засобів на боці хоста використовуйте ін’єктований runtime плагіна замість прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Такий самий шаблон застосовується до інших застарілих допоміжних функцій мосту:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | допоміжні функції сховища сеансів | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Замініть широкі імпорти infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` досі існує для зовнішньої
    сумісності, але новий код має імпортувати зосереджену поверхню допоміжних функцій,
    яка йому фактично потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Допоміжні функції черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Допоміжні функції подій Heartbeat і видимості | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Спорожнення черги очікуваної доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Кеші дедуплікації в памʼяті | `openclaw/plugin-sdk/dedupe-runtime` |
    | Допоміжні функції безпечних шляхів до локальних файлів/медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch з урахуванням диспетчера | `openclaw/plugin-sdk/runtime-fetch` |
    | Допоміжні функції проксі та захищеного fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політики диспетчера SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запиту/вирішення затвердження | `openclaw/plugin-sdk/approval-runtime` |
    | Допоміжні функції payload відповіді на затвердження та команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Допоміжні функції форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Допоміжні функції безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена конкурентність асинхронних завдань | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Локальне для процесу асинхронне блокування | `openclaw/plugin-sdk/async-lock-runtime` |
    | Файлові блокування | `openclaw/plugin-sdk/file-lock` |

    Пакетні plugins захищені сканером від `infra-runtime`, тому код репозиторію
    не може регресувати до широкого barrel.

  </Step>

  <Step title="Мігруйте допоміжні функції маршрутів каналів">
    Новий код маршрутів каналів має використовувати `openclaw/plugin-sdk/channel-route`.
    Старі назви route-key і comparable-target залишаються як псевдоніми сумісності
    протягом вікна міграції, але нові plugins мають використовувати назви маршрутів,
    які безпосередньо описують поведінку:

    | Стара допоміжна функція | Сучасна допоміжна функція |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Сучасні допоміжні функції маршрутів послідовно нормалізують `{ channel, to, accountId, threadId }`
    для нативних затверджень, приглушення відповідей, вхідної дедуплікації,
    доставки cron і маршрутизації сеансів. Якщо ваш plugin має власну граматику цілей,
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

## Довідник шляхів імпорту

  <Accordion title="Common import path table">
  | Шлях імпорту | Призначення | Основні експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний засіб точки входу Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий umbrella-реекспорт для визначень/будівників точок входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб точки входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення та будівники точок входу каналу | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Запити allowlist, будівники стану налаштування |
  | `plugin-sdk/setup-runtime` | Runtime-допоміжні засоби часу налаштування | Import-safe адаптери патчів налаштування, допоміжні засоби нотаток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби адаптерів налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку облікових записів/конфігурації/шлюзу дій |
  | `plugin-sdk/account-id` | Допоміжні засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису | Допоміжні засоби пошуку облікового запису + резервного значення за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби облікового запису | Допоміжні засоби списку облікових записів/дій облікового запису |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, плюс `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви сполучення DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді, введення тексту та зв’язування доставки з джерела | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Будівники схем конфігурації | Лише спільні примітиви схеми конфігурації каналу та універсальний будівник |
  | `plugin-sdk/bundled-channel-config-schema` | Вбудовані схеми конфігурації | Лише підтримувані OpenClaw вбудовані Plugins; нові Plugins мають визначати локальні для Plugin схеми |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі вбудовані схеми конфігурації | Лише псевдонім сумісності; використовуйте `plugin-sdk/bundled-channel-config-schema` для підтримуваних вбудованих Plugins |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація імен команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Допоміжні засоби стану облікового запису та життєвого циклу потоку чернеток | `createAccountStatusSink`, допоміжні засоби фіналізації попереднього перегляду чернеток |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби вхідного envelope | Спільні допоміжні засоби маршруту + будівника envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби вхідних відповідей | Спільні допоміжні засоби запису та диспетчеризації |
  | `plugin-sdk/messaging-targets` | Розбір цілі повідомлень | Допоміжні засоби розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Допоміжні засоби залежностей вихідного надсилання | Легкий пошук `resolveOutboundSendDep` без імпорту повного вихідного runtime |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідного runtime | Допоміжні засоби вихідної доставки, делегата ідентичності/надсилання, сеансу, форматування та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби прив’язки потоків | Допоміжні засоби життєвого циклу прив’язки потоків і адаптерів |
  | `plugin-sdk/agent-media-payload` | Допоміжні засоби застарілих media payload | Будівник agent media payload для застарілих схем полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти runtime каналу |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі runtime-допоміжні засоби | Допоміжні засоби runtime/логування/резервного копіювання/встановлення Plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime-середовища | Допоміжні засоби logger/runtime env, timeout, retry та backoff |
  | `plugin-sdk/plugin-runtime` | Спільні runtime-допоміжні засоби Plugin | Допоміжні засоби команд/hooks/http/інтерактиву Plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра hooks | Спільні допоміжні засоби конвеєра Webhook/внутрішніх hooks |
  | `plugin-sdk/lazy-runtime` | Ледачі runtime-допоміжні засоби | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Runtime-допоміжні засоби CLI | Форматування команд, очікування, допоміжні засоби версії |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Клієнт Gateway і допоміжні засоби патчів стану каналу |
  | `plugin-sdk/config-runtime` | Застарілий shim сумісності конфігурації | Надавайте перевагу `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Fallback-стабільні допоміжні засоби перевірки команд Telegram, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби запиту схвалення | Payload схвалення exec/Plugin, допоміжні засоби можливостей/профілів схвалення, маршрутизації/ runtime нативного схвалення та форматування шляху структурованого відображення схвалення |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби авторизації схвалення | Визначення approver, авторизація дії в тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта схвалення | Допоміжні засоби профілю/фільтра нативного схвалення exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки схвалень | Адаптери можливостей/доставки нативного схвалення |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби Gateway для схвалення | Спільний допоміжний засіб визначення Gateway для схвалення |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера схвалення | Легкі допоміжні засоби завантаження адаптера нативного схвалення для гарячих точок входу каналу |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника схвалення | Ширші runtime-допоміжні засоби обробника схвалення; надавайте перевагу вужчим швам адаптера/Gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілей схвалення | Допоміжні засоби прив’язки нативної цілі/облікового запису схвалення |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповідей схвалення | Допоміжні засоби payload відповіді схвалення exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби runtime-контексту каналу | Універсальні допоміжні засоби register/get/watch runtime-контексту каналу |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби довіри, шлюзування DM, зовнішнього вмісту та збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Runtime-допоміжні засоби SSRF | Pinned-dispatcher, захищений fetch, допоміжні засоби політики SSRF |
  | `plugin-sdk/system-event-runtime` | Допоміжні засоби системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби Heartbeat | Допоміжні засоби подій Heartbeat і видимості |
  | `plugin-sdk/delivery-queue-runtime` | Допоміжні засоби черги доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Допоміжні засоби активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Допоміжні засоби дедуплікації | Кеші дедуплікації в пам’яті |
  | `plugin-sdk/file-access-runtime` | Допоміжні засоби доступу до файлів | Допоміжні засоби безпечних локальних файлових/media-шляхів |
  | `plugin-sdk/transport-ready-runtime` | Допоміжні засоби готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичного шлюзування | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch/proxy | `resolveFetch`, допоміжні засоби proxy |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби retry | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Мапінг введення allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Допоміжні засоби шлюзування команд і поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери стану/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір введення секретів | Допоміжні засоби введення секретів |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запиту Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби guard для тіла Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповідей | Вхідна диспетчеризація, Heartbeat, планувальник відповідей, розбиття на фрагменти |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації відповідей | Допоміжні засоби фіналізації, диспетчеризації провайдера та міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби фрагментів відповіді | Допоміжні засоби розбиття text/markdown на фрагменти |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сеансів | Допоміжні засоби шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів стану та OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби маршрутизації/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації session-key |
  | `plugin-sdk/status-helpers` | Допоміжні засоби стану каналу | Будівники зведення стану каналу/облікового запису, значення runtime-state за замовчуванням, допоміжні засоби метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби резолвера цілей | Спільні допоміжні засоби резолвера цілей |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Витягувати рядкові URL з request-like входів |
  | `plugin-sdk/run-command` | Допоміжні засоби timed command | Виконавець timed command із нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Читачі параметрів | Спільні читачі параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витягування tool payload | Витягувати нормалізовані payload з об’єктів результатів tool |
  | `plugin-sdk/tool-send` | Витягування tool send | Витягувати канонічні поля цілі надсилання з args tool |
  | `plugin-sdk/temp-path` | Помічники тимчасових шляхів | Спільні помічники шляхів для тимчасових завантажень |
  | `plugin-sdk/logging-core` | Помічники журналювання | Помічники журналера підсистеми та редагування чутливих даних |
  | `plugin-sdk/markdown-table-runtime` | Помічники Markdown-таблиць | Помічники режиму Markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи відповідей на повідомлення | Типи корисного навантаження відповіді |
  | `plugin-sdk/provider-setup` | Добірні помічники налаштування локальних/самостійно розміщених провайдерів | Помічники виявлення/конфігурації самостійно розміщених провайдерів |
  | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані помічники налаштування OpenAI-сумісних самостійно розміщених провайдерів | Ті самі помічники виявлення/конфігурації самостійно розміщених провайдерів |
  | `plugin-sdk/provider-auth-runtime` | Помічники runtime-автентифікації провайдера | Помічники визначення API-ключів під час виконання |
  | `plugin-sdk/provider-auth-api-key` | Помічники налаштування API-ключів провайдера | Помічники онбордингу API-ключів/запису профілю |
  | `plugin-sdk/provider-auth-result` | Помічники результатів автентифікації провайдера | Стандартний конструктор результату OAuth-автентифікації |
  | `plugin-sdk/provider-auth-login` | Помічники інтерактивного входу провайдера | Спільні помічники інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Помічники вибору провайдера | Вибір налаштованого або автоматичного провайдера та злиття сирої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Помічники env-var провайдера | Помічники пошуку env-var автентифікації провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні помічники моделей/відтворення провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори політик відтворення, помічники endpoint провайдера та помічники нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні помічники каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу провайдера | Помічники конфігурації онбордингу |
  | `plugin-sdk/provider-http` | HTTP-помічники провайдера | Універсальні помічники можливостей HTTP/endpoint провайдера, зокрема помічники multipart-форм для транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Помічники web-fetch провайдера | Помічники реєстрації/кешу web-fetch провайдера |
  | `plugin-sdk/provider-web-search-config-contract` | Помічники конфігурації web-search провайдера | Вузькі помічники конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення ввімкнення Plugin |
  | `plugin-sdk/provider-web-search-contract` | Помічники контракту web-search провайдера | Вузькі помічники контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і обмежені за областю сетери/гетери облікових даних |
  | `plugin-sdk/provider-web-search` | Помічники web-search провайдера | Помічники реєстрації/кешу/runtime web-search провайдера |
  | `plugin-sdk/provider-tools` | Помічники сумісності інструментів/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також помічники сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Помічники використання провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші помічники використання провайдера |
  | `plugin-sdk/provider-stream` | Помічники обгорток потоків провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні помічники обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Помічники транспорту провайдера | Помічники нативного транспорту провайдера, як-от захищений fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні помічники медіа | Помічники отримання/перетворення/зберігання медіа плюс конструктори медійного корисного навантаження |
  | `plugin-sdk/media-generation-runtime` | Спільні помічники генерації медіа | Спільні помічники failover, вибір кандидатів і повідомлення про відсутні моделі для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Помічники розуміння медіа | Типи провайдерів розуміння медіа плюс експорт помічників зображень/аудіо для провайдерів |
  | `plugin-sdk/text-runtime` | Спільні помічники тексту | Вилучення тексту, видимого асистенту, помічники рендерингу/фрагментації/таблиць Markdown, помічники редагування чутливих даних, помічники directive-tag, утиліти безпечного тексту та пов’язані помічники тексту/журналювання |
  | `plugin-sdk/text-chunking` | Помічники фрагментації тексту | Помічник фрагментації вихідного тексту |
  | `plugin-sdk/speech` | Помічники мовлення | Типи провайдерів мовлення плюс експорт для провайдерів: директиви, реєстр, помічники валідації та OpenAI-сумісний конструктор TTS |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдерів мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Помічники транскрипції в реальному часі | Типи провайдерів, помічники реєстру та спільний помічник WebSocket-сесії |
  | `plugin-sdk/realtime-voice` | Помічники голосу в реальному часі | Типи провайдерів, помічники реєстру/визначення та помічники bridge-сесій |
  | `plugin-sdk/image-generation` | Помічники генерації зображень | Типи провайдерів генерації зображень плюс помічники URL-адрес ресурсів/даних зображень і OpenAI-сумісний конструктор провайдера зображень |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, failover, автентифікація та помічники реєстру |
  | `plugin-sdk/music-generation` | Помічники генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, помічники failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/video-generation` | Помічники генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, помічники failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Помічники інтерактивної відповіді | Нормалізація/зведення корисного навантаження інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви schema конфігурації каналу |
  | `plugin-sdk/channel-config-writes` | Помічники запису конфігурації каналу | Помічники авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула каналу | Експорт спільної преамбули Plugin каналу |
  | `plugin-sdk/channel-status` | Помічники стану каналу | Спільні помічники знімка/зведення стану каналу |
  | `plugin-sdk/allowlist-config-edit` | Помічники конфігурації allowlist | Помічники редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Помічники групового доступу | Спільні помічники рішень щодо групового доступу |
  | `plugin-sdk/direct-dm` | Помічники прямих DM | Спільні помічники автентифікації/захисту прямих DM |
  | `plugin-sdk/extension-shared` | Спільні помічники розширення | Примітиви помічників пасивного каналу/стану та ambient proxy |
  | `plugin-sdk/webhook-targets` | Помічники цілей Webhook | Реєстр цілей Webhook і помічники встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Помічники шляхів Webhook | Помічники нормалізації шляхів Webhook |
  | `plugin-sdk/web-media` | Спільні помічники вебмедіа | Помічники завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Реекспорт Zod | Реекспортований `zod` для споживачів plugin SDK |
  | `plugin-sdk/memory-core` | Вбудовані помічники memory-core | Поверхня помічників менеджера пам’яті/конфігурації/файлів/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime-фасад рушія пам’яті | Runtime-фасад індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Рушій foundation хоста пам’яті | Експорт рушія foundation хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embedding хоста пам’яті | Контракти embedding пам’яті, доступ до реєстру, локальний провайдер і універсальні помічники batch/remote; конкретні віддалені провайдери містяться у своїх власних plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста пам’яті | Експорт рушія QMD хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам’яті | Експорт рушія сховища хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні помічники хоста пам’яті | Мультимодальні помічники хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Помічники запитів хоста пам’яті | Помічники запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Помічники секретів хоста пам’яті | Помічники секретів хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Помічники журналу подій хоста пам’яті | Помічники журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Помічники стану хоста пам’яті | Помічники стану хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста пам’яті | Runtime-помічники CLI хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime хоста пам’яті | Core runtime-помічники хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Помічники файлів/runtime хоста пам’яті | Помічники файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім core runtime хоста пам’яті | Vendor-нейтральний псевдонім для core runtime-помічників хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Vendor-нейтральний псевдонім для помічників журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime хоста пам’яті | Vendor-нейтральний псевдонім для помічників файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Помічники керованого Markdown | Спільні помічники керованого Markdown для plugins, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку active memory | Лінивий runtime-фасад менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім стану хоста пам’яті | Vendor-нейтральний псевдонім для помічників стану хоста пам’яті |
  | `plugin-sdk/testing` | Тестові утиліти | Застарілий широкий barrel сумісності; надавайте перевагу сфокусованим тестовим subpaths, як-от `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно є спільною підмножиною міграції, а не повною
поверхнею SDK. Повний список із понад 200 точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні шви вбудованих плагінів вилучено з карти експортів
публічного SDK, окрім явно задокументованих фасадів сумісності, як-от
застарілий шим `plugin-sdk/discord`, збережений для опублікованого пакета
`@openclaw/discord@2026.3.13`. Допоміжні засоби, специфічні для власника,
містяться всередині пакета плагіна-власника; спільна поведінка хоста має
переходити через загальні контракти SDK, як-от `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.

Використовуйте найвужчий імпорт, що відповідає задачі. Якщо не можете знайти
експорт, перевірте джерело в `src/plugin-sdk/` або запитайте в мейнтейнерів,
який загальний контракт має ним володіти.

## Активні застаріння

Вужчі застаріння, що застосовуються в SDK плагінів, контракті провайдера,
поверхні виконання та маніфесті. Кожне з них усе ще працює сьогодні, але буде
видалене в майбутньому мажорному релізі. Запис під кожним пунктом зіставляє
старий API з його канонічною заміною.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — лише імпортовані з вужчого підшляху. `command-auth`
    повторно експортує їх як заглушки сумісності.

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
    один об'єкт рішення замість двох окремих викликів.

    Низхідні плагіни каналів (Slack, Discord, Matrix, MS Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` — це шим сумісності для старіших
    плагінів каналів. Не імпортуйте його з нового коду; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації об'єктів
    виконання.

    Допоміжні засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions`
    застаріли разом із сирими експортами канальних "actions". Натомість
    надавайте можливості через семантичну поверхню `presentation` — плагіни
    каналів оголошують, що вони відображають (картки, кнопки, селекти), а не
    які сирі назви дій вони приймають.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в плагіні провайдера.
    OpenClaw більше не потребує допоміжного засобу SDK для реєстрації обгортки
    інструмента.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плаского текстового
    конверта підказки з вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача.
    Плагіни каналів додають метадані маршрутизації (тред, тему, відповідь-на,
    реакції) як типізовані поля замість конкатенації їх у рядок підказки.
    Допоміжний засіб `formatAgentEnvelope(...)` усе ще підтримується для
    синтезованих конвертів, призначених для асистента, але вхідні текстові
    конверти поступово виводяться з використання.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який
    користувацький плагін каналу, що постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    Чотири псевдоніми типів виявлення тепер є тонкими обгортками над типами
    епохи каталогу:

    | Старий псевдонім          | Новий тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс застарілий статичний набір `ProviderCapabilities` — плагіни
    провайдерів мають використовувати явні хуки провайдера, як-от
    `buildReplayPolicy`, `normalizeToolSchemas` і `wrapStreamFn`, а не
    статичний об'єкт.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Старе** (три окремі хуки в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: один `resolveThinkingProfile(ctx)`, що повертає
    `ProviderThinkingProfile` з канонічним `id`, необов'язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично понижує застарілі
    збережені значення за рангом профілю.

    Реалізуйте один хук замість трьох. Застарілі хуки продовжують працювати
    протягом вікна застаріння, але не компонуються з результатом профілю.

  </Accordion>

  <Accordion title="External OAuth provider fallback → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без оголошення
    провайдера в маніфесті плагіна.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті плагіна
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях "auth
    fallback" видає попередження під час виконання та буде видалений.

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

    **Нове**: віддзеркальте той самий пошук змінних середовища в
    `setup.providers[].envVars` у маніфесті. Це консолідує метадані середовища
    для налаштування/стану в одному місці й уникає запуску середовища виконання
    плагіна лише для відповіді на запити змінних середовища.

    `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності
    до завершення вікна застаріння.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик в API стану пам'яті —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Додавальні допоміжні засоби пам'яті
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачеплені.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    Два застарілі псевдоніми типів усе ще експортуються з `src/plugins/runtime/types.ts`:

    | Старе                         | Нове                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Метод виконання `readSession` застарів на користь `getSessionMessages`.
    Та сама сигнатура; старий метод передає виклик новому.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Старе**: `runtime.tasks.flow` (однина) повертав активний аксесор потоку
    задач.

    **Нове**: `runtime.tasks.managedFlows` зберігає середовище виконання
    мутацій керованого TaskFlow для плагінів, які створюють, оновлюють,
    скасовують або запускають дочірні задачі з потоку. Використовуйте
    `runtime.tasks.flows`, коли плагіну потрібні лише читання на основі DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    Розглянуто в розділі "Як мігрувати → Міграція розширень результатів
    інструментів Pi до проміжного ПЗ" вище. Додано тут для повноти: видалений
    шлях лише для Pi `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` із явним списком середовищ
    виконання в `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `OpenClawSchemaType`, повторно експортований з `openclaw/plugin-sdk`, тепер
    є однорядковим псевдонімом для `OpenClawConfig`. Надавайте перевагу
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
Застаріння рівня розширень (усередині вбудованих плагінів каналів/провайдерів
у `extensions/`) відстежуються у власних барелях `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх плагінів і не перелічені тут. Якщо ви
споживаєте локальний барель вбудованого плагіна напряму, прочитайте коментарі
про застаріння в цьому барелі перед оновленням.
</Note>

## Графік видалення

| Коли                   | Що станеться                                                           |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні видають попередження під час виконання              |
| **Наступний мажорний реліз** | Застарілі поверхні буде видалено; плагіни, що досі їх використовують, зазнають збою |

Усі основні плагіни вже мігровано. Зовнішні плагіни мають мігрувати до
наступного мажорного релізу.

## Тимчасове придушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий аварійний вихід, а не постійне рішення.

## Пов'язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший плагін
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — створення плагінів каналів
- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — створення плагінів провайдерів
- [Внутрішня архітектура плагінів](/uk/plugins/architecture) — глибокий огляд архітектури
- [Маніфест плагіна](/uk/plugins/manifest) — довідник схеми маніфесту
