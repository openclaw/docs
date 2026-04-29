---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували api.registerEmbeddedExtensionFactory до OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури Plugin
    - Ви супроводжуєте зовнішній Plugin для OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний SDK для Plugin
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-29T07:02:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: f701495b97e2660b5d0b9b65866ddaa7fc3ce91e6610950c9fb034f983dc1340
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури Plugin
із цілеспрямованими, задокументованими імпортами. Якщо ваш Plugin було створено до
нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система Plugin надавала дві широко відкриті поверхні, які дозволяли Plugin імпортувати
усе потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — один імпорт, що повторно експортував десятки
  допоміжних засобів. Його запровадили, щоб зберегти роботу старіших Plugin на основі хуків, поки
  будувалася нова архітектура Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** — широкий пакет runtime-допоміжних засобів, який
  змішував системні події, стан heartbeat, черги доставки, допоміжні засоби fetch/proxy,
  файлові допоміжні засоби, типи схвалення та непов’язані утиліти.
- **`openclaw/plugin-sdk/config-runtime`** — широкий пакет сумісності конфігурації,
  який усе ще містить застарілі прямі допоміжні засоби завантаження/запису під час вікна
  міграції.
- **`openclaw/extension-api`** — міст, який надавав Plugin прямий доступ до
  допоміжних засобів з боку хоста, як-от вбудованого запуску агента.
- **`api.registerEmbeddedExtensionFactory(...)`** — вилучений хук bundled extension лише для Pi,
  який міг спостерігати події embedded-runner, такі як
  `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють під час виконання,
але нові Plugin не повинні їх використовувати, а наявні Plugin мають мігрувати до того,
як наступний major release їх вилучить. API реєстрації embedded extension factory лише для Pi
було вилучено; натомість використовуйте middleware для результатів інструментів.

OpenClaw не вилучає й не переінтерпретовує задокументовану поведінку Plugin у тій самій
зміні, яка вводить заміну. Зміни контракту, що порушують сумісність, спершу мають пройти через
адаптер сумісності, діагностику, документацію та вікно deprecation.
Це стосується імпортів SDK, полів manifest, setup API, хуків і поведінки
runtime-реєстрації.

<Warning>
  Шар зворотної сумісності буде вилучено в майбутньому major release.
  Plugin, які все ще імпортують із цих поверхонь, зламаються, коли це станеться.
  Реєстрації embedded extension factory лише для Pi вже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного допоміжного засобу завантажував десятки непов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Нечітка поверхня API** — не було способу визначити, які експорти стабільні, а які внутрішні

Сучасний SDK Plugin це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є малим, самодостатнім модулем із чіткою метою та задокументованим контрактом.

Legacy provider convenience seams для bundled channels також вилучено.
Channel-branded helper seams були приватними скороченнями mono-repo, а не стабільними
контрактами Plugin. Натомість використовуйте вузькі generic SDK subpaths. Усередині робочої області bundled
Plugin тримайте provider-owned helpers у власному `api.ts` або
`runtime-api.ts` цього Plugin.

Поточні приклади bundled provider:

- Anthropic тримає специфічні для Claude допоміжні засоби stream у власному `api.ts` /
  `contract-api.ts` seam
- OpenAI тримає provider builders, допоміжні засоби default-model і realtime provider
  builders у власному `api.ts`
- OpenRouter тримає provider builder і допоміжні засоби onboarding/config у власному
  `api.ts`

## Політика сумісності

Для зовнішніх Plugin робота із сумісністю відбувається в такому порядку:

1. додати новий контракт
2. залишити стару поведінку підключеною через адаптер сумісності
3. видавати діагностику або попередження, що називає старий шлях і заміну
4. покрити обидва шляхи тестами
5. задокументувати deprecation і шлях міграції
6. вилучати лише після оголошеного вікна міграції, зазвичай у major release

Maintainers можуть перевірити поточну чергу міграції за допомогою
`pnpm plugins:boundary-report`. Використовуйте `pnpm plugins:boundary-report:summary` для
стислих підрахунків, `--owner <id>` для одного Plugin або власника сумісності, і
`pnpm plugins:boundary-report:ci`, коли CI gate має падати через протерміновані
записи сумісності, cross-owner reserved SDK imports або unused reserved SDK
subpaths. Звіт групує застарілі
записи сумісності за датою вилучення, рахує локальні посилання в коді/документації,
показує cross-owner reserved SDK imports і підсумовує приватний
memory-host SDK bridge, щоб очищення сумісності залишалося явним, а не
покладалося на ad hoc пошуки. Reserved SDK subpaths повинні мати відстежене використання власником;
unused reserved helper exports слід вилучити з публічного SDK.

Якщо поле manifest усе ще приймається, автори Plugin можуть продовжувати його використовувати, доки
документація й діагностика не скажуть інакше. Новий код має надавати перевагу задокументованій
заміні, але наявні Plugin не повинні ламатися під час звичайних minor
releases.

## Як виконати міграцію

<Steps>
  <Step title="Мігруйте допоміжні засоби завантаження/запису runtime-конфігурації">
    Bundled Plugin мають припинити прямі виклики
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Надавайте перевагу конфігурації, яку
    вже було передано в активний шлях виклику. Довгоживучі handlers, яким потрібен
    поточний snapshot процесу, можуть використовувати `api.runtime.config.current()`. Довгоживучі
    agent tools мають використовувати `ctx.getRuntimeConfig()` з tool context усередині
    `execute`, щоб інструмент, створений до запису конфігурації, усе ще бачив оновлену
    runtime config.

    Записи конфігурації мають проходити через транзакційні допоміжні засоби й вибирати
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
    що зміна потребує чистого перезапуску gateway, і
    `afterWrite: { mode: "none", reason: "..." }` лише тоді, коли caller володіє
    follow-up і навмисно хоче придушити reload planner.
    Результати мутації містять типізований підсумок `followUp` для тестів і логування;
    gateway залишається відповідальним за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються застарілими допоміжними засобами сумісності
    для зовнішніх Plugin під час вікна міграції та один раз попереджають із
    кодом сумісності `runtime-config-load-write`. Bundled Plugin і repo
    runtime code захищені scanner guardrails у
    `pnpm check:deprecated-internal-config-api` і
    `pnpm check:no-runtime-action-load-config`: нове використання production Plugin
    завершується помилкою одразу, прямі записи конфігурації падають, методи gateway server мають використовувати
    request runtime snapshot, runtime channel send/action/client helpers
    мають отримувати конфігурацію зі своєї межі, а довгоживучі runtime modules мають
    нуль дозволених ambient викликів `loadConfig()`.

    Новий код Plugin також має уникати імпорту широкого
    пакета сумісності `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    SDK subpath, який відповідає задачі:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, як-от `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Твердження для вже завантаженої конфігурації та пошук plugin-entry config | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного runtime snapshot | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Допоміжні засоби session store | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація Markdown table | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime-допоміжні засоби group policy | `openclaw/plugin-sdk/runtime-group-policy` |
    | Розв’язання secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/session overrides | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled Plugin і їхні тести scanner-guarded проти широкого
    barrel, щоб імпорти й mocks залишалися локальними для потрібної їм поведінки. Широкий
    barrel усе ще існує для зовнішньої сумісності, але новий код не повинен
    від нього залежати.

  </Step>

  <Step title="Мігруйте Pi tool-result extensions на middleware">
    Bundled Plugin мають замінити Pi-only
    handlers результатів інструментів `api.registerEmbeddedExtensionFactory(...)` на
    runtime-neutral middleware.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Одночасно оновіть manifest Plugin:

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
    `approvalCapability.nativeRuntime` плюс спільний runtime-context registry.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть approval-specific auth/delivery зі старої зв’язки `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` вилучено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render на `approvalCapability`
    - `plugin.auth` залишається лише для channel login/logout flows; approval auth
      hooks там більше не читаються core
    - Реєструйте channel-owned runtime objects, як-от clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте plugin-owned reroute notices із native approval handlers;
      core тепер володіє routed-elsewhere notices з фактичних результатів доставки
    - Передаючи `channelRuntime` у `createChannelManager(...)`, надавайте
      реальну поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Див. `/plugins/sdk-channel-plugins` для поточного компонування approval capability.

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

    Якщо ваш caller навмисно не покладається на shell fallback, не встановлюйте
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

  <Step title="Замініть на цілеспрямовані імпорти">
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

    Для host-side helpers використовуйте injected plugin runtime замість прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Такий самий шаблон застосовується до інших застарілих допоміжних функцій bridge:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | допоміжні функції сховища сесій | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Замініть широкі імпорти infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` досі існує для зовнішньої
    сумісності, але новий код має імпортувати сфокусовану поверхню допоміжних функцій, яка
    йому фактично потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Допоміжні функції черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Допоміжні функції подій Heartbeat і видимості | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Спорожнення черги очікуваних доставок | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Кеші дедуплікації в памʼяті | `openclaw/plugin-sdk/dedupe-runtime` |
    | Допоміжні функції безпечних шляхів до локальних файлів/медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch з урахуванням диспетчера | `openclaw/plugin-sdk/runtime-fetch` |
    | Допоміжні функції proxy та захищеного fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політики диспетчера SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запиту/вирішення схвалення | `openclaw/plugin-sdk/approval-runtime` |
    | Допоміжні функції payload відповіді схвалення та команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Допоміжні функції форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Допоміжні функції безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена паралельність асинхронних задач | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Асинхронне блокування в межах процесу | `openclaw/plugin-sdk/async-lock-runtime` |
    | Блокування файлів | `openclaw/plugin-sdk/file-lock` |

    Вбудовані plugins захищені scanner від `infra-runtime`, тому код репозиторію
    не може повернутися до широкого barrel.

  </Step>

  <Step title="Мігруйте допоміжні функції маршрутів каналів">
    Новий код маршрутів каналів має використовувати `openclaw/plugin-sdk/channel-route`.
    Старі назви route-key і comparable-target залишаються як псевдоніми
    сумісності протягом вікна міграції, але нові plugins мають використовувати назви route,
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

    Сучасні допоміжні функції route узгоджено нормалізують `{ channel, to, accountId, threadId }`
    для нативних схвалень, придушення відповідей, дедуплікації вхідних повідомлень,
    доставки cron і маршрутизації сесій. Якщо ваш plugin має власну граматику цілей,
    використовуйте `resolveChannelRouteTargetWithParser(...)`, щоб адаптувати цей
    parser до того самого контракту цілі route.

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
  | `plugin-sdk/plugin-entry` | Канонічний помічник точки входу Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий загальний реекспорт для визначень/побудовників точок входу каналів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Помічник точки входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення та побудовники точок входу каналів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні помічники майстра налаштування | Підказки списку дозволених, побудовники стану налаштування |
  | `plugin-sdk/setup-runtime` | Помічники runtime часу налаштування | Безпечні для імпорту адаптери патчів налаштування, помічники нотаток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Помічники адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Помічники інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Помічники кількох облікових записів | Помічники списку облікових записів/конфігурації/шлюзу дій |
  | `plugin-sdk/account-id` | Помічники ідентифікатора облікового запису | `DEFAULT_ACCOUNT_ID`, нормалізація ідентифікатора облікового запису |
  | `plugin-sdk/account-resolution` | Помічники пошуку облікового запису | Помічники пошуку облікового запису та резервного значення за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі помічники облікових записів | Помічники списку облікових записів/дій облікового запису |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви сполучення DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді, індикація введення та зв’язування доставлення джерела | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Побудовники схем конфігурації | Спільні примітиви схеми конфігурації каналів і лише універсальний побудовник |
  | `plugin-sdk/bundled-channel-config-schema` | Вбудовані схеми конфігурації | Лише вбудовані plugins, що підтримуються OpenClaw; нові plugins мають визначати локальні для Plugin схеми |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі вбудовані схеми конфігурації | Лише псевдонім сумісності; використовуйте `plugin-sdk/bundled-channel-config-schema` для підтримуваних вбудованих plugins |
  | `plugin-sdk/telegram-command-config` | Помічники конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Помічники стану облікового запису та життєвого циклу чернеткового потоку | `createAccountStatusSink`, помічники фіналізації попереднього перегляду чернетки |
  | `plugin-sdk/inbound-envelope` | Помічники вхідного конверта | Спільні помічники маршруту та побудовника конвертів |
  | `plugin-sdk/inbound-reply-dispatch` | Помічники вхідних відповідей | Спільні помічники запису та диспетчеризації |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Помічники розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Помічники вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Помічники залежностей вихідного надсилання | Легкий пошук `resolveOutboundSendDep` без імпорту повного вихідного runtime |
  | `plugin-sdk/outbound-runtime` | Помічники вихідного runtime | Помічники вихідного доставлення, делегата ідентичності/надсилання, сеансу, форматування та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Помічники прив’язок потоків | Помічники життєвого циклу прив’язок потоків і адаптерів |
  | `plugin-sdk/agent-media-payload` | Застарілі помічники payload медіа | Побудовник payload медіа агента для застарілих розкладок полів |
  | `plugin-sdk/channel-runtime` | Застаріла прокладка сумісності | Лише застарілі утиліти runtime каналу |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповідей |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі помічники runtime | Помічники runtime/логування/резервного копіювання/встановлення Plugin |
  | `plugin-sdk/runtime-env` | Вузькі помічники середовища runtime | Логер/середовище runtime, timeout, повтор і помічники backoff |
  | `plugin-sdk/plugin-runtime` | Спільні помічники runtime Plugin | Помічники команд/хуків/http/інтерактивності Plugin |
  | `plugin-sdk/hook-runtime` | Помічники конвеєра хуків | Спільні помічники конвеєра webhook/внутрішніх хуків |
  | `plugin-sdk/lazy-runtime` | Помічники лінивого runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Помічники процесів | Спільні помічники exec |
  | `plugin-sdk/cli-runtime` | Помічники runtime CLI | Форматування команд, очікування, помічники версій |
  | `plugin-sdk/gateway-runtime` | Помічники Gateway | Клієнт Gateway і помічники патчів стану каналу |
  | `plugin-sdk/config-runtime` | Застаріла прокладка сумісності конфігурації | Надавайте перевагу `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Помічники команд Telegram | Резервно-стабільні помічники перевірки команд Telegram, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Помічники підказок схвалення | Payload схвалення exec/Plugin, помічники можливостей/профілів схвалення, власна маршрутизація/ runtime схвалень і форматування шляху відображення структурованого схвалення |
  | `plugin-sdk/approval-auth-runtime` | Помічники автентифікації схвалень | Визначення approver, авторизація дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Помічники клієнта схвалень | Помічники власного профілю/фільтра схвалення exec |
  | `plugin-sdk/approval-delivery-runtime` | Помічники доставлення схвалень | Адаптери власних можливостей/доставлення схвалень |
  | `plugin-sdk/approval-gateway-runtime` | Помічники Gateway схвалень | Спільний помічник визначення Gateway схвалень |
  | `plugin-sdk/approval-handler-adapter-runtime` | Помічники адаптера схвалень | Легкі помічники завантаження власного адаптера схвалень для гарячих точок входу каналів |
  | `plugin-sdk/approval-handler-runtime` | Помічники обробника схвалень | Ширші помічники runtime обробника схвалень; надавайте перевагу вужчим швам адаптера/Gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Помічники цілей схвалення | Помічники прив’язки власної цілі/облікового запису схвалення |
  | `plugin-sdk/approval-reply-runtime` | Помічники відповідей на схвалення | Помічники payload відповіді схвалення exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Помічники runtime-контексту каналу | Універсальні помічники реєстрації/отримання/відстеження runtime-контексту каналу |
  | `plugin-sdk/security-runtime` | Помічники безпеки | Спільні помічники довіри, шлюзу DM, зовнішнього вмісту та збирання секретів |
  | `plugin-sdk/ssrf-policy` | Помічники політики SSRF | Помічники списку дозволених хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Помічники runtime SSRF | Закріплений диспетчер, захищений fetch, помічники політики SSRF |
  | `plugin-sdk/system-event-runtime` | Помічники системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Помічники Heartbeat | Помічники подій і видимості Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Помічники черги доставлення | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Помічники активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Помічники дедуплікації | Кеші дедуплікації в пам’яті |
  | `plugin-sdk/file-access-runtime` | Помічники доступу до файлів | Безпечні помічники шляхів локальних файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Помічники готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Помічники обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Помічники шлюзу діагностики | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Помічники форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, помічники графа помилок |
  | `plugin-sdk/fetch-runtime` | Обгорнуті помічники fetch/proxy | `resolveFetch`, помічники proxy |
  | `plugin-sdk/host-runtime` | Помічники нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Помічники повторів | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування списку дозволених | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Зіставлення вводу списку дозволених | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Шлюз команд і помічники поверхні команд | `resolveControlCommandGate`, помічники авторизації відправника, помічники реєстру команд, зокрема форматування меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери стану/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір введення секретів | Помічники введення секретів |
  | `plugin-sdk/webhook-ingress` | Помічники запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Помічники захисту тіла Webhook | Помічники читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповідей | Вхідна диспетчеризація, Heartbeat, планувальник відповідей, розбиття на фрагменти |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі помічники диспетчеризації відповідей | Фіналізація, диспетчеризація провайдера та помічники міток розмов |
  | `plugin-sdk/reply-history` | Помічники історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Помічники фрагментів відповіді | Помічники фрагментації тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Помічники сховища сеансів | Помічники шляху сховища та updated-at |
  | `plugin-sdk/state-paths` | Помічники шляхів стану | Помічники каталогів стану та OAuth |
  | `plugin-sdk/routing` | Помічники маршрутизації/ключа сеансу | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, помічники нормалізації ключа сеансу |
  | `plugin-sdk/status-helpers` | Помічники стану каналу | Побудовники зведення стану каналу/облікового запису, стандартні значення runtime-state, помічники метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Помічники визначення цілей | Спільні помічники визначення цілей |
  | `plugin-sdk/string-normalization-runtime` | Помічники нормалізації рядків | Помічники нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Помічники URL запиту | Витягування рядкових URL з request-like вводів |
  | `plugin-sdk/run-command` | Помічники команд з таймером | Виконавець команд з таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Спільні зчитувачі параметрів інструментів/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload інструмента | Витягування нормалізованих payload з об’єктів результатів інструмента |
  | `plugin-sdk/tool-send` | Витягування надсилання інструмента | Витягування канонічних полів цілі надсилання з аргументів інструмента |
  | `plugin-sdk/temp-path` | Допоміжні засоби шляхів temp | Спільні допоміжні засоби шляхів для тимчасових завантажень |
  | `plugin-sdk/logging-core` | Допоміжні засоби журналювання | Допоміжні засоби журналювання підсистем і редагування чутливих даних |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби таблиць Markdown | Допоміжні засоби режиму таблиць Markdown |
  | `plugin-sdk/reply-payload` | Типи відповідей на повідомлення | Типи корисного навантаження відповіді |
  | `plugin-sdk/provider-setup` | Підібрані допоміжні засоби налаштування локального/самостійно розміщеного провайдера | Допоміжні засоби виявлення/конфігурації самостійно розміщеного провайдера |
  | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані допоміжні засоби налаштування самостійно розміщеного провайдера, сумісного з OpenAI | Ті самі допоміжні засоби виявлення/конфігурації самостійно розміщеного провайдера |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби автентифікації провайдера під час виконання | Допоміжні засоби визначення API-ключа під час виконання |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключа провайдера | Допоміжні засоби онбордингу API-ключа/запису профілю |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби результату автентифікації провайдера | Стандартний побудовник результату автентифікації OAuth |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного входу провайдера | Спільні допоміжні засоби інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору провайдера | Вибір налаштованого або автоматичного провайдера та об’єднання необробленої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env-var провайдера | Допоміжні засоби пошуку env-var автентифікації провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделей/відтворення провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політик відтворення, допоміжні засоби provider-endpoint і нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу провайдера | Допоміжні засоби конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP провайдера | Узагальнені допоміжні засоби можливостей HTTP/кінцевих точок провайдера, включно з допоміжними засобами multipart-форми для транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch провайдера | Допоміжні засоби реєстрації/кешу провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації web-search провайдера | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення вмикання Plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту web-search провайдера | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped-сетери/гетери облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search провайдера | Допоміжні засоби реєстрації/кешу/виконання провайдера web-search |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності інструментів/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби використання провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби використання провайдера |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгорток потоків провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби транспорту провайдера | Нативні допоміжні засоби транспорту провайдера, як-от захищений fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
  | `plugin-sdk/keyed-async-queue` | Впорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби медіа | Допоміжні засоби отримання/перетворення/зберігання медіа, визначення розмірів відео на основі ffprobe і побудовники корисного навантаження медіа |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації медіа | Спільні допоміжні засоби failover, вибору кандидатів і повідомлень про відсутні моделі для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби розуміння медіа | Типи провайдерів розуміння медіа плюс експорти допоміжних засобів для зображень/аудіо, орієнтовані на провайдерів |
  | `plugin-sdk/text-runtime` | Спільні допоміжні засоби тексту | Вилучення видимого для асистента тексту, допоміжні засоби рендерингу/фрагментації/таблиць Markdown, допоміжні засоби редагування чутливих даних, допоміжні засоби directive-tag, утиліти safe-text і пов’язані допоміжні засоби тексту/журналювання |
  | `plugin-sdk/text-chunking` | Допоміжні засоби фрагментації тексту | Допоміжний засіб фрагментації вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні засоби мовлення | Типи провайдерів мовлення плюс орієнтовані на провайдерів допоміжні засоби директив, реєстру, валідації та побудовник TTS, сумісний з OpenAI |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдерів мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрипції в реальному часі | Типи провайдерів, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу в реальному часі | Типи провайдерів, допоміжні засоби реєстру/визначення та допоміжні засоби bridge-сесій |
  | `plugin-sdk/image-generation` | Допоміжні засоби генерації зображень | Типи провайдерів генерації зображень плюс допоміжні засоби ресурсів зображень/data URL і побудовник провайдера зображень, сумісний з OpenAI |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, failover, автентифікація та допоміжні засоби реєстру |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивної відповіді | Нормалізація/редукція корисного навантаження інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви config-schema каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації каналу | Допоміжні засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула каналу | Спільні експорти преамбули Plugin каналу |
  | `plugin-sdk/channel-status` | Допоміжні засоби статусу каналу | Спільні допоміжні засоби знімка/зведення статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації allowlist | Допоміжні засоби редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби групового доступу | Спільні допоміжні засоби рішень щодо групового доступу |
  | `plugin-sdk/direct-dm` | Допоміжні засоби Direct-DM | Спільні допоміжні засоби автентифікації/захисту Direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби розширень | Примітиви пасивного каналу/статусу та допоміжні примітиви ambient proxy |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляху Webhook | Допоміжні засоби нормалізації шляху Webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби вебмедіа | Допоміжні засоби завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів plugin SDK |
  | `plugin-sdk/memory-core` | Вбудовані допоміжні засоби memory-core | Поверхня допоміжних засобів менеджера/конфігурації/файлів/CLI пам’яті |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад виконання рушія пам’яті | Фасад виконання індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій хоста пам’яті | Експорти базового рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embedding хоста пам’яті | Контракти embedding пам’яті, доступ до реєстру, локальний провайдер і узагальнені batch/remote допоміжні засоби; конкретні віддалені провайдери містяться у своїх Plugin-власниках |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста пам’яті | Експорти рушія QMD хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам’яті | Експорти рушія сховища хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті | Мультимодальні допоміжні засоби хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті | Допоміжні засоби запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті | Допоміжні засоби секретів хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті | Допоміжні засоби журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті | Допоміжні засоби статусу хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | Виконання CLI хоста пам’яті | Допоміжні засоби виконання CLI хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Ядро виконання хоста пам’яті | Допоміжні засоби ядра виконання хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/виконання хоста пам’яті | Допоміжні засоби файлів/виконання хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім ядра виконання хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів ядра виконання хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/виконання хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів файлів/виконання хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого Markdown | Спільні допоміжні засоби керованого Markdown для суміжних із пам’яттю Plugin |
  | `plugin-sdk/memory-host-search` | Фасад пошуку active memory | Фасад виконання менеджера пошуку active-memory з лінивим завантаженням |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів статусу хоста пам’яті |
  | `plugin-sdk/testing` | Тестові утиліти | Застарілий широкий barrel сумісності; надавайте перевагу спеціалізованим тестовим підшляхам, як-от `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно є спільною підмножиною для міграції, а не повною
поверхнею SDK. Повний список із понад 200 точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні шви вбудованих Plugin було вилучено з публічної мапи
експорту SDK, за винятком явно задокументованих фасадів сумісності, як-от
застарілий шим `plugin-sdk/discord`, залишений для опублікованого пакета
`@openclaw/discord@2026.3.13`. Допоміжні засоби, специфічні для власника,
містяться всередині пакета Plugin-власника; спільна поведінка хоста має
проходити через загальні контракти SDK, як-от `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.

Використовуйте найвужчий імпорт, що відповідає завданню. Якщо не можете знайти
експорт, перевірте вихідний код у `src/plugin-sdk/` або запитайте
супроводжувачів, який загальний контракт має ним володіти.

## Активні застарілі API

Вужчі застарілі API, що застосовуються до SDK Plugin, контракту провайдера,
runtime-поверхні та маніфесту. Кожен із них усе ще працює сьогодні, але буде
вилучений у майбутньому мажорному випуску. Запис під кожним пунктом зіставляє
старий API з його канонічною заміною.

<AccordionGroup>
  <Accordion title="Допоміжні конструктори command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — лише імпортовані з вужчого підшляху. `command-auth`
    реекспортує їх як заглушки сумісності.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Допоміжні засоби гейтингу згадок → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    один об'єкт рішення замість двох окремих викликів.

    Низхідні Plugin каналів (Slack, Discord, Matrix, MS Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Шим runtime каналу та допоміжні засоби дій каналу">
    `openclaw/plugin-sdk/channel-runtime` — це шим сумісності для старіших
    Plugin каналів. Не імпортуйте його з нового коду; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації runtime-
    об'єктів.

    Допоміжні засоби `channelActions*` в `openclaw/plugin-sdk/channel-actions`
    застаріли разом із сирими експортами каналу "actions". Натомість
    виставляйте можливості через семантичну поверхню `presentation` — Plugin
    каналів оголошують, що вони відображають (картки, кнопки, селекти), а не
    які сирі назви дій вони приймають.

  </Accordion>

  <Accordion title="Допоміжний tool() провайдера вебпошуку → createTool() у Plugin">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в Plugin провайдера.
    OpenClaw більше не потребує допоміжного засобу SDK для реєстрації
    обгортки інструмента.

  </Accordion>

  <Accordion title="Plaintext-обгортки каналу → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови пласкої plaintext-
    обгортки prompt із вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача.
    Plugin каналів додають метадані маршрутизації (thread, topic, reply-to,
    reactions) як типізовані поля замість конкатенації їх у рядок prompt.
    Допоміжний засіб `formatAgentEnvelope(...)` усе ще підтримується для
    синтезованих обгорток, орієнтованих на асистента, але вхідні plaintext-
    обгортки поступово вилучаються.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який
    кастомний Plugin каналу, що постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи виявлення провайдера → типи каталогу провайдера">
    Чотири псевдоніми типів виявлення тепер є тонкими обгортками над типами
    епохи каталогу:

    | Старий псевдонім         | Новий тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс застарілий статичний набір `ProviderCapabilities` — Plugin
    провайдерів мають використовувати явні хуки провайдера, як-от
    `buildReplayPolicy`, `normalizeToolSchemas` і `wrapStreamFn`, замість
    статичного об'єкта.

  </Accordion>

  <Accordion title="Хуки політики мислення → resolveThinkingProfile">
    **Старе** (три окремі хуки в `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: один `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` з канонічним `id`, необов'язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично знижує застарілі
    збережені значення за рангом профілю.

    Реалізуйте один хук замість трьох. Застарілі хуки продовжують працювати
    протягом вікна застарівання, але не компонуються з результатом профілю.

  </Accordion>

  <Accordion title="Fallback зовнішнього OAuth-провайдера → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без оголошення
    провайдера в маніфесті Plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у маніфесті Plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях "auth
    fallback" виводить попередження під час виконання і буде вилучений.

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
    у маніфесті. Це консолідує метадані env для налаштування/статусу в одному
    місці та уникає запуску runtime Plugin лише для відповіді на запити
    env-var.

    `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності
    до завершення вікна застарівання.

  </Accordion>

  <Accordion title="Реєстрація Plugin пам'яті → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик в API стану пам'яті —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Додаткові допоміжні засоби пам'яті
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачіпаються.

  </Accordion>

  <Accordion title="Типи повідомлень сесії subagent перейменовано">
    Два застарілі псевдоніми типів усе ще експортуються з `src/plugins/runtime/types.ts`:

    | Старе                         | Нове                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` застарів на користь `getSessionMessages`.
    Сигнатура та сама; старий метод викликає новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Старе**: `runtime.tasks.flow` (однина) повертав live-аксесор task-flow.

    **Нове**: `runtime.tasks.managedFlows` зберігає керований runtime мутацій
    TaskFlow для Plugin, що створюють, оновлюють, скасовують або запускають
    дочірні завдання з потоку. Використовуйте `runtime.tasks.flows`, коли
    Plugin потрібні лише читання на основі DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Вбудовані фабрики розширень → middleware результатів інструментів агента">
    Описано вище в "Як мігрувати → Перенесіть розширення результатів
    інструментів Pi до middleware". Додано тут для повноти: вилучений шлях
    лише для Pi `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime
    у `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Псевдонім OpenClawSchemaType → OpenClawConfig">
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
Застарілі API рівня розширень (усередині вбудованих Plugin каналів/провайдерів
під `extensions/`) відстежуються у власних barrel-файлах `api.ts` і
`runtime-api.ts`. Вони не впливають на контракти сторонніх Plugin і не
перелічені тут. Якщо ви напряму використовуєте локальний barrel вбудованого
Plugin, прочитайте коментарі про застарівання в цьому barrel перед оновленням.
</Note>

## Графік вилучення

| Коли                   | Що відбувається                                                        |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні виводять runtime-попередження                        |
| **Наступний мажорний випуск** | Застарілі поверхні буде вилучено; Plugin, що досі їх використовують, не працюватимуть |

Усі core Plugin уже мігровано. Зовнішні Plugin мають мігрувати до наступного
мажорного випуску.

## Тимчасове придушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий аварійний вихід, а не постійне рішення.

## Пов'язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [Plugin каналів](/uk/plugins/sdk-channel-plugins) — створення Plugin каналів
- [Plugin провайдерів](/uk/plugins/sdk-provider-plugins) — створення Plugin провайдерів
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — глибокий огляд архітектури
- [Маніфест Plugin](/uk/plugins/manifest) — довідник схеми маніфесту
