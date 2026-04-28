---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували api.registerEmbeddedExtensionFactory до OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури Plugin
    - Ви супроводжуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-28T20:12:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: efaf0f397e7b06a67fd324f1710ac62529dd2c039d483b381a8df5495716cd51
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури Plugin
із сфокусованими, задокументованими імпортами. Якщо ваш Plugin було створено до
нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система Plugin надавала дві широко відкриті поверхні, які дозволяли Plugins імпортувати
усе потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — один імпорт, який реекспортував десятки
  допоміжних функцій. Його було запроваджено, щоб старі Plugins на основі хуків продовжували працювати, поки
  створювалася нова архітектура Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** — широкий barrel із runtime-допоміжними функціями, який
  змішував системні події, стан Heartbeat, черги доставки, допоміжні функції fetch/proxy,
  файлові допоміжні функції, типи погоджень і непов’язані утиліти.
- **`openclaw/plugin-sdk/config-runtime`** — широкий barrel сумісності конфігурації,
  який досі містить застарілі прямі допоміжні функції завантаження/запису протягом міграційного
  вікна.
- **`openclaw/extension-api`** — міст, який надавав Plugins прямий доступ до
  допоміжних функцій на боці хоста, як-от вбудований агентний runner.
- **`api.registerEmbeddedExtensionFactory(...)`** — видалений bundled
  extension hook лише для Pi, який міг спостерігати події embedded-runner, такі як
  `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони досі працюють під час виконання,
але нові Plugins не повинні їх використовувати, а наявні Plugins мають виконати міграцію до того,
як наступний major release їх видалить. API реєстрації фабрики вбудованих extensions лише для Pi
було видалено; натомість використовуйте middleware для tool-result.

OpenClaw не видаляє і не переінтерпретовує задокументовану поведінку Plugin у тій самій
зміні, яка запроваджує заміну. Критичні зміни контракту мають спочатку пройти
через адаптер сумісності, діагностику, документацію і вікно застарівання.
Це стосується імпортів SDK, полів маніфесту, API налаштування, хуків і поведінки
реєстрації під час виконання.

<Warning>
  Шар зворотної сумісності буде видалено в майбутньому major release.
  Plugins, які досі імпортують із цих поверхонь, зламаються, коли це станеться.
  Реєстрації фабрик вбудованих extensions лише для Pi вже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт однієї допоміжної функції завантажував десятки непов’язаних модулів
- **Циклічні залежності** — широкі реекспорти спрощували створення циклів імпорту
- **Нечітка поверхня API** — не було способу визначити, які експорти стабільні, а які внутрішні

Сучасний SDK для Plugin це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим, самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Legacy provider convenience seams для bundled channels також видалено.
Допоміжні seams із брендингом каналів були приватними скороченнями mono-repo, а не стабільними
контрактами Plugin. Використовуйте натомість вузькі generic SDK subpaths. Усередині workspace
bundled Plugin тримайте provider-owned helpers у власному `api.ts` або
`runtime-api.ts` цього Plugin.

Поточні приклади bundled provider:

- Anthropic тримає Claude-specific stream helpers у власному seam `api.ts` /
  `contract-api.ts`
- OpenAI тримає provider builders, default-model helpers і realtime provider
  builders у власному `api.ts`
- OpenRouter тримає provider builder і onboarding/config helpers у власному
  `api.ts`

## Політика сумісності

Для зовнішніх Plugins робота із сумісністю відбувається в такому порядку:

1. додати новий контракт
2. зберегти стару поведінку, підключену через адаптер сумісності
3. вивести діагностику або попередження, що називає старий шлях і заміну
4. покрити обидва шляхи тестами
5. задокументувати застарівання і шлях міграції
6. видаляти лише після оголошеного міграційного вікна, зазвичай у major release

Maintainers можуть перевірити поточну чергу міграції за допомогою
`pnpm plugins:boundary-report`. Використовуйте `pnpm plugins:boundary-report:summary` для
компактних підрахунків, `--owner <id>` для одного Plugin або власника сумісності, і
`pnpm plugins:boundary-report:ci`, коли CI gate має падати через прострочені
записи сумісності, cross-owner reserved SDK imports або unused reserved SDK
subpaths. Звіт групує застарілі
записи сумісності за датою видалення, підраховує локальні посилання в коді/документації,
виявляє cross-owner reserved SDK imports і підсумовує приватний
memory-host SDK bridge, щоб очищення сумісності залишалося явним, а не
спиралося на ad hoc пошуки. Reserved SDK subpaths повинні мати відстежене використання власником;
невикористані reserved helper exports слід видалити з public SDK.

Якщо поле маніфесту досі приймається, автори Plugin можуть продовжувати його використовувати, доки
документація й діагностика не скажуть інше. Новий код має надавати перевагу задокументованій
заміні, але наявні Plugins не повинні ламатися під час звичайних minor
releases.

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть runtime config load/write helpers">
    Bundled Plugins мають припинити прямі виклики
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Надавайте перевагу конфігурації, яку
    вже було передано в активний шлях виклику. Long-lived handlers, яким потрібен
    поточний snapshot процесу, можуть використовувати `api.runtime.config.current()`. Long-lived
    agent tools мають використовувати `ctx.getRuntimeConfig()` з tool context усередині
    `execute`, щоб tool, створений до запису конфігурації, все одно бачив оновлену
    runtime config.

    Записи конфігурації мають проходити через transactional helpers і вибирати
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
    що зміна потребує clean gateway restart, і
    `afterWrite: { mode: "none", reason: "..." }` лише тоді, коли caller володіє
    подальшою дією і свідомо хоче придушити reload planner.
    Результати мутації містять typed `followUp` summary для тестів і logging;
    Gateway залишається відповідальним за застосування або планування restart.
    `loadConfig` і `writeConfigFile` залишаються застарілими допоміжними функціями сумісності
    для зовнішніх Plugins протягом міграційного вікна і попереджають один раз із
    compatibility code `runtime-config-load-write`. Bundled Plugins і repo
    runtime code захищені scanner guardrails у
    `pnpm check:deprecated-internal-config-api` і
    `pnpm check:no-runtime-action-load-config`: нове production використання Plugin
    завершується помилкою відразу, direct config writes завершуються помилкою, методи gateway server мають використовувати
    request runtime snapshot, runtime channel send/action/client helpers
    мають отримувати config зі своєї межі, а long-lived runtime modules мають
    нуль дозволених ambient викликів `loadConfig()`.

    Новий код Plugin також має уникати імпорту широкого
    barrel сумісності `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    SDK subpath, який відповідає задачі:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи config, такі як `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Уже завантажені config assertions і plugin-entry config lookup | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання current runtime snapshot | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи config | `openclaw/plugin-sdk/config-mutation` |
    | Допоміжні функції session store | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown table config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Допоміжні функції group policy runtime | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret input resolution | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/session overrides | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled Plugins і їхні тести захищені scanner-guard від широкого
    barrel, щоб imports і mocks залишалися локальними до потрібної їм поведінки. Широкий
    barrel досі існує для зовнішньої сумісності, але новий код не повинен
    від нього залежати.

  </Step>

  <Step title="Перенесіть Pi tool-result extensions на middleware">
    Bundled Plugins мають замінити tool-result handlers
    `api.registerEmbeddedExtensionFactory(...)` лише для Pi на
    runtime-neutral middleware.

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

    Зовнішні Plugins не можуть реєструвати tool-result middleware, бо воно може
    переписувати high-trust tool output до того, як модель його побачить.

  </Step>

  <Step title="Перенесіть approval-native handlers на capability facts">
    Approval-capable channel Plugins тепер expose native approval behavior через
    `approvalCapability.nativeRuntime` плюс спільний runtime-context registry.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть approval-specific auth/delivery зі старого wiring `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` видалено з public channel-plugin
      contract; перенесіть delivery/native/render fields на `approvalCapability`
    - `plugin.auth` залишається лише для channel login/logout flows; approval auth
      hooks там більше не читаються core
    - Реєструйте channel-owned runtime objects, як-от clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте plugin-owned reroute notices із native approval handlers;
      core тепер володіє routed-elsewhere notices з actual delivery results
    - Передаючи `channelRuntime` у `createChannelManager(...)`, надайте
      справжню поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Див. `/plugins/sdk-channel-plugins` для поточного approval capability
    layout.

  </Step>

  <Step title="Перевірте fallback-поведінку Windows wrapper">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, unresolved Windows
    wrappers `.cmd`/`.bat` тепер fail closed, якщо ви явно не передасте
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

    Якщо ваш caller не покладається навмисно на shell fallback, не задавайте
    `allowShellFallback` і натомість обробіть thrown error.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у своєму Plugin імпорти з будь-якої застарілої поверхні:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на сфокусовані імпорти">
    Кожен експорт зі старої поверхні зіставляється з конкретним сучасним шляхом імпорту:

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

    Для допоміжних функцій на боці хоста використовуйте injected plugin runtime замість прямого
    імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується до інших застарілих допоміжних засобів bridge:

    | Старий імпорт | Сучасний еквівалент |
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
    `openclaw/plugin-sdk/infra-runtime` досі існує для зовнішньої
    сумісності, але новий код має імпортувати сфокусовану поверхню допоміжних засобів, яка
    йому фактично потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Допоміжні засоби черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Допоміжні засоби подій Heartbeat і видимості | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Спорожнення черги очікуваної доставки | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-memory кеші дедуплікації | `openclaw/plugin-sdk/dedupe-runtime` |
    | Безпечні допоміжні засоби шляхів локальних файлів/медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch з урахуванням диспетчера | `openclaw/plugin-sdk/runtime-fetch` |
    | Допоміжні засоби проксі та захищеного fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політики диспетчера SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запиту/розв’язання затвердження | `openclaw/plugin-sdk/approval-runtime` |
    | Допоміжні засоби payload відповіді на затвердження та команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Допоміжні засоби форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Допоміжні засоби безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена конкурентність асинхронних задач | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Локальний для процесу асинхронний lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | Файлові lock | `openclaw/plugin-sdk/file-lock` |

    Вбудовані plugins захищені сканером від `infra-runtime`, тож код репозиторію
    не може регресувати до широкого barrel.

  </Step>

  <Step title="Мігруйте допоміжні засоби маршрутів каналів">
    Новий код маршрутів каналів має використовувати `openclaw/plugin-sdk/channel-route`.
    Старі назви route-key і comparable-target залишаються псевдонімами
    сумісності на час міграційного вікна, але нові plugins мають використовувати назви маршрутів,
    які прямо описують поведінку:

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
    cron-доставки та маршрутизації сесій. Якщо ваш plugin має власну граматику цілей,
    використовуйте `resolveChannelRouteTargetWithParser(...)`, щоб адаптувати цей
    парсер до того самого контракту route target.

  </Step>

  <Step title="Зберіть і протестуйте">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Довідник шляхів імпорту

  <Accordion title="Поширена таблиця шляхів імпорту">
  | Шлях імпорту | Призначення | Ключові експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний помічник точки входу plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий об'єднувальний реекспорт для визначень/будівників точок входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Помічник точки входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення й будівники точок входу каналу | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні помічники майстра налаштування | Запити списку дозволених, будівники стану налаштування |
  | `plugin-sdk/setup-runtime` | Runtime-помічники часу налаштування | Імпортобезпечні адаптери патчів налаштування, помічники приміток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Помічники адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Помічники інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Помічники кількох облікових записів | Помічники списку облікових записів/конфігурації/шлюзу дій |
  | `plugin-sdk/account-id` | Помічники account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Помічники пошуку облікового запису | Помічники пошуку облікового запису й резервного значення за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі помічники облікових записів | Помічники списку облікових записів/дій облікового запису |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви сполучення DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді, набір тексту та підключення доставки джерела | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Будівники схеми конфігурації | Лише спільні примітиви схеми конфігурації каналу й універсальний будівник |
  | `plugin-sdk/bundled-channel-config-schema` | Вбудовані схеми конфігурації | Лише вбудовані plugins, підтримувані OpenClaw; нові plugins мають визначати локальні для plugin схеми |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі вбудовані схеми конфігурації | Лише псевдонім сумісності; використовуйте `plugin-sdk/bundled-channel-config-schema` для підтримуваних вбудованих plugins |
  | `plugin-sdk/telegram-command-config` | Помічники конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Розв'язання політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Помічники стану облікового запису й життєвого циклу потоку чернеток | `createAccountStatusSink`, помічники фіналізації попереднього перегляду чернетки |
  | `plugin-sdk/inbound-envelope` | Помічники вхідного конверта | Спільні помічники маршруту й будівника конверта |
  | `plugin-sdk/inbound-reply-dispatch` | Помічники вхідної відповіді | Спільні помічники запису й диспетчеризації |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Помічники розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Помічники вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Помічники залежностей вихідного надсилання | Легкий пошук `resolveOutboundSendDep` без імпорту повного вихідного runtime |
  | `plugin-sdk/outbound-runtime` | Помічники вихідного runtime | Помічники вихідної доставки, делегата ідентичності/надсилання, сесії, форматування та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Помічники прив'язок потоків | Помічники життєвого циклу прив'язок потоків і адаптера |
  | `plugin-sdk/agent-media-payload` | Помічники застарілого media payload | Будівник agent media payload для застарілих компонувань полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти runtime каналу |
  | `plugin-sdk/channel-send-result` | Типи результату надсилання | Типи результату відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі runtime-помічники | Помічники runtime/журналювання/резервного копіювання/встановлення plugin |
  | `plugin-sdk/runtime-env` | Вузькі помічники runtime env | Помічники logger/runtime env, timeout, retry та backoff |
  | `plugin-sdk/plugin-runtime` | Спільні помічники runtime plugin | Помічники команд/хуків/http/інтерактивних можливостей plugin |
  | `plugin-sdk/hook-runtime` | Помічники конвеєра хуків | Спільні помічники Webhook/внутрішнього конвеєра хуків |
  | `plugin-sdk/lazy-runtime` | Помічники lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Помічники процесів | Спільні помічники exec |
  | `plugin-sdk/cli-runtime` | Runtime-помічники CLI | Форматування команд, очікування, помічники версій |
  | `plugin-sdk/gateway-runtime` | Помічники Gateway | Клієнт Gateway і помічники патчів стану каналу |
  | `plugin-sdk/config-runtime` | Застарілий shim сумісності конфігурації | Надавайте перевагу `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Помічники команд Telegram | Резервно-стабільні помічники перевірки команд Telegram, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Помічники запитів схвалення | Payload схвалення exec/plugin, помічники можливостей/профілів схвалення, нативна маршрутизація/ runtime схвалення та форматування структурованого шляху відображення схвалення |
  | `plugin-sdk/approval-auth-runtime` | Помічники автентифікації схвалення | Розв'язання approver, авторизація дії в тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Помічники клієнта схвалення | Помічники профілю/фільтра нативного схвалення exec |
  | `plugin-sdk/approval-delivery-runtime` | Помічники доставки схвалення | Нативні адаптери можливостей/доставки схвалення |
  | `plugin-sdk/approval-gateway-runtime` | Помічники Gateway схвалення | Спільний помічник розв'язання Gateway для схвалення |
  | `plugin-sdk/approval-handler-adapter-runtime` | Помічники адаптера схвалення | Легкі помічники завантаження нативного адаптера схвалення для гарячих entrypoints каналу |
  | `plugin-sdk/approval-handler-runtime` | Помічники обробника схвалення | Ширші runtime-помічники обробника схвалення; надавайте перевагу вужчим адаптерним/Gateway швам, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Помічники цілі схвалення | Помічники прив'язки нативної цілі/облікового запису схвалення |
  | `plugin-sdk/approval-reply-runtime` | Помічники відповіді схвалення | Помічники payload відповіді схвалення exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Помічники runtime-контексту каналу | Універсальні помічники register/get/watch runtime-контексту каналу |
  | `plugin-sdk/security-runtime` | Помічники безпеки | Спільні помічники довіри, шлюзування DM, зовнішнього вмісту та збирання секретів |
  | `plugin-sdk/ssrf-policy` | Помічники політики SSRF | Помічники списку дозволених хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Runtime-помічники SSRF | Помічники закріпленого dispatcher, guarded fetch, політики SSRF |
  | `plugin-sdk/system-event-runtime` | Помічники системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Помічники Heartbeat | Помічники подій Heartbeat і видимості |
  | `plugin-sdk/delivery-queue-runtime` | Помічники черги доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Помічники активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Помічники дедуплікації | In-memory кеші дедуплікації |
  | `plugin-sdk/file-access-runtime` | Помічники доступу до файлів | Помічники безпечних шляхів локальних файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Помічники готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Помічники обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Помічники шлюзування діагностики | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Помічники форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, помічники графа помилок |
  | `plugin-sdk/fetch-runtime` | Обгорнуті помічники fetch/proxy | `resolveFetch`, помічники proxy |
  | `plugin-sdk/host-runtime` | Помічники нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Помічники retry | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування списку дозволених | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Зіставлення входів списку дозволених | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Шлюзування команд і помічники командної поверхні | `resolveControlCommandGate`, помічники авторизації відправника, помічники реєстру команд, зокрема форматування меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери стану/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір введення секретів | Помічники введення секретів |
  | `plugin-sdk/webhook-ingress` | Помічники запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Помічники guard для тіла Webhook | Помічники читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповіді | Вхідна диспетчеризація, heartbeat, планувальник відповіді, розбиття на chunks |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі помічники диспетчеризації відповіді | Фіналізація, диспетчеризація провайдера та помічники міток розмов |
  | `plugin-sdk/reply-history` | Помічники історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилання на відповідь | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Помічники chunks відповіді | Помічники розбиття тексту/markdown на chunks |
  | `plugin-sdk/session-store-runtime` | Помічники сховища сесій | Помічники шляху сховища й updated-at |
  | `plugin-sdk/state-paths` | Помічники шляхів стану | Помічники каталогів стану та OAuth |
  | `plugin-sdk/routing` | Помічники routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, помічники нормалізації session-key |
  | `plugin-sdk/status-helpers` | Помічники стану каналу | Будівники підсумку стану каналу/облікового запису, стандартні значення runtime-state, помічники метаданих issue |
  | `plugin-sdk/target-resolver-runtime` | Помічники розв'язувача цілей | Спільні помічники розв'язувача цілей |
  | `plugin-sdk/string-normalization-runtime` | Помічники нормалізації рядків | Помічники нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Помічники URL запиту | Витягування рядкових URL із request-like входів |
  | `plugin-sdk/run-command` | Помічники команд із таймером | Виконавець команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Спільні зчитувачі параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload tool | Витягування нормалізованих payload з об'єктів результату tool |
  | `plugin-sdk/tool-send` | Витягування send tool | Витягування канонічних полів цілі надсилання з args tool |
  | `plugin-sdk/temp-path` | Допоміжні засоби для тимчасових шляхів | Спільні допоміжні засоби для шляхів тимчасових завантажень |
  | `plugin-sdk/logging-core` | Допоміжні засоби журналювання | Допоміжні засоби для журналювача підсистеми та редагування |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби для Markdown-таблиць | Допоміжні засоби режиму Markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи відповідей на повідомлення | Типи корисного навантаження відповіді |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локального/саморозміщеного провайдера | Допоміжні засоби виявлення/налаштування саморозміщеного провайдера |
  | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування саморозміщеного провайдера, сумісного з OpenAI | Ті самі допоміжні засоби виявлення/налаштування саморозміщеного провайдера |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби автентифікації виконання провайдера | Допоміжні засоби визначення API-ключа під час виконання |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключа провайдера | Допоміжні засоби онбордингу API-ключа/запису профілю |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби результату автентифікації провайдера | Стандартний побудовник результату автентифікації OAuth |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного входу провайдера | Спільні допоміжні засоби інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору провайдера | Вибір налаштованого або автоматичного провайдера та об’єднання сирої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env-var провайдера | Допоміжні засоби пошуку env-var автентифікації провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделі/повторного відтворення провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політик повторного відтворення, допоміжні засоби кінцевих точок провайдера та допоміжні засоби нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу провайдера | Допоміжні засоби конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP провайдера | Загальні допоміжні засоби можливостей HTTP/кінцевих точок провайдера, зокрема допоміжні засоби multipart-форми для транскрибування аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch провайдера | Допоміжні засоби реєстрації/кешу провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації web-search провайдера | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення ввімкнення plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту web-search провайдера | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і локалізовані сетери/гетери облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search провайдера | Допоміжні засоби реєстрації/кешу/виконання провайдера web-search |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності інструментів/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби використання провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби використання провайдера |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгорток потоків провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби транспорту провайдера | Власні допоміжні засоби транспорту провайдера, як-от захищений fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
  | `plugin-sdk/keyed-async-queue` | Впорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби медіа | Допоміжні засоби завантаження/перетворення/зберігання медіа, а також побудовники корисного навантаження медіа |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації медіа | Спільні допоміжні засоби перемикання в разі збою, вибору кандидатів і повідомлень про відсутні моделі для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби розуміння медіа | Типи провайдерів розуміння медіа, а також експорти допоміжних засобів зображень/аудіо для провайдерів |
  | `plugin-sdk/text-runtime` | Спільні допоміжні засоби тексту | Видалення видимого асистенту тексту, допоміжні засоби рендерингу/розбиття на фрагменти/таблиць Markdown, допоміжні засоби редагування, допоміжні засоби тегів директив, утиліти безпечного тексту та пов’язані допоміжні засоби тексту/журналювання |
  | `plugin-sdk/text-chunking` | Допоміжні засоби розбиття тексту на фрагменти | Допоміжний засіб розбиття вихідного тексту на фрагменти |
  | `plugin-sdk/speech` | Допоміжні засоби мовлення | Типи провайдерів мовлення, а також допоміжні засоби директив, реєстру, перевірки для провайдерів і побудовник TTS, сумісний з OpenAI |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдерів мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрибування в реальному часі | Типи провайдерів, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу в реальному часі | Типи провайдерів, допоміжні засоби реєстру/визначення та допоміжні засоби bridge-сесій |
  | `plugin-sdk/image-generation` | Допоміжні засоби генерації зображень | Типи провайдерів генерації зображень, а також допоміжні засоби ресурсів зображень/data URL і побудовник провайдера зображень, сумісний з OpenAI |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, перемикання в разі збою, автентифікація та допоміжні засоби реєстру |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби перемикання в разі збою, пошук провайдера та розбір model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби перемикання в разі збою, пошук провайдера та розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивної відповіді | Нормалізація/скорочення корисного навантаження інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви схеми конфігурації каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації каналу | Допоміжні засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула каналу | Спільні експорти преамбули plugin каналу |
  | `plugin-sdk/channel-status` | Допоміжні засоби стану каналу | Спільні допоміжні засоби знімка/підсумку стану каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації allowlist | Допоміжні засоби редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби доступу групи | Спільні допоміжні засоби рішень доступу групи |
  | `plugin-sdk/direct-dm` | Допоміжні засоби direct-DM | Спільні допоміжні засоби автентифікації/захисту direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби розширення | Примітиви допоміжних засобів пасивного каналу/стану та ambient proxy |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляху Webhook | Допоміжні засоби нормалізації шляху Webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби вебмедіа | Допоміжні засоби завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів SDK plugin |
  | `plugin-sdk/memory-core` | Вбудовані допоміжні засоби memory-core | Поверхня допоміжних засобів менеджера пам’яті/конфігурації/файлів/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад виконання рушія пам’яті | Фасад виконання індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Рушій foundation хоста пам’яті | Експорти рушія foundation хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embedding хоста пам’яті | Контракти embedding пам’яті, доступ до реєстру, локальний провайдер і загальні допоміжні засоби пакетної/віддаленої обробки; конкретні віддалені провайдери живуть у власних plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста пам’яті | Експорти рушія QMD хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам’яті | Експорти рушія сховища хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті | Мультимодальні допоміжні засоби хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті | Допоміжні засоби запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті | Допоміжні засоби секретів хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті | Допоміжні засоби журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби стану хоста пам’яті | Допоміжні засоби стану хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | Виконання CLI хоста пам’яті | Допоміжні засоби виконання CLI хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Основне виконання хоста пам’яті | Допоміжні засоби основного виконання хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/виконання хоста пам’яті | Допоміжні засоби файлів/виконання хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім основного виконання хоста пам’яті | Vendor-neutral псевдонім для допоміжних засобів основного виконання хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Vendor-neutral псевдонім для допоміжних засобів журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/виконання хоста пам’яті | Vendor-neutral псевдонім для допоміжних засобів файлів/виконання хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого Markdown | Спільні допоміжні засоби керованого Markdown для plugins, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий фасад виконання менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім стану хоста пам’яті | Vendor-neutral псевдонім для допоміжних засобів стану хоста пам’яті |
  | `plugin-sdk/testing` | Тестові утиліти | Застарілий широкий barrel сумісності; надавайте перевагу сфокусованим тестовим підшляхам, як-от `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно є спільною підмножиною для міграції, а не повною
поверхнею SDK. Повний список із 200+ точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні seams для bundled-plugin було вилучено з публічної
карти експорту SDK, за винятком явно задокументованих фасадів сумісності, як-от
застарілий shim `plugin-sdk/discord`, збережений для опублікованого пакета
`@openclaw/discord@2026.3.13`. Допоміжні засоби, специфічні для власника,
розміщуються всередині пакета Plugin-власника; спільна поведінка хоста має
переходити через загальні контракти SDK, як-от `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.

Використовуйте найвужчий import, що відповідає завданню. Якщо не можете знайти
export, перевірте джерело в `src/plugin-sdk/` або запитайте maintainer-ів, який
загальний контракт має ним володіти.

## Активні застаріння

Вужчі застаріння, що застосовуються в SDK Plugin, контракті провайдера,
runtime-поверхні та manifest. Кожне з них усе ще працює сьогодні, але буде
видалене в майбутньому major release. Запис під кожним пунктом зіставляє старий
API з його канонічною заміною.

<AccordionGroup>
  <Accordion title="Допоміжні побудовники command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі signatures, ті самі
    exports — лише імпорт із вужчого subpath. `command-auth`
    re-export-ить їх як compat stubs.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Допоміжні засоби gating для mention → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    єдиний об’єкт рішення замість двох окремих викликів.

    Низхідні channel plugins (Slack, Discord, Matrix, MS Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Shim runtime каналу та допоміжні засоби дій каналу">
    `openclaw/plugin-sdk/channel-runtime` — це shim сумісності для старіших
    channel plugins. Не імпортуйте його з нового коду; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації runtime
    objects.

    Допоміжні засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions`
    застаріли разом із сирими exports каналів "actions". Натомість expose-те
    capabilities через семантичну поверхню `presentation` — channel plugins
    оголошують, що вони render-ять (cards, buttons, selects), а не які сирі
    назви action вони приймають.

  </Accordion>

  <Accordion title="Допоміжний tool() провайдера вебпошуку → createTool() у Plugin">
    **Старе**: factory `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в provider plugin.
    OpenClaw більше не потребує допоміжного засобу SDK для реєстрації обгортки
    tool.

  </Accordion>

  <Accordion title="Plaintext envelopes каналу → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови flat plaintext prompt
    envelope з вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс structured user-context blocks. Channel
    plugins додають routing metadata (thread, topic, reply-to, reactions) як
    typed fields замість конкатенації їх у prompt string. Допоміжний засіб
    `formatAgentEnvelope(...)` усе ще підтримується для synthesized
    assistant-facing envelopes, але inbound plaintext envelopes поступово
    виводяться.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який custom
    channel plugin, що post-processed текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи provider discovery → типи provider catalog">
    Чотири aliases типів discovery тепер є тонкими обгортками над типами
    епохи catalog:

    | Старий alias              | Новий тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс legacy static bag `ProviderCapabilities` — provider plugins мають
    додавати capability facts через контракт provider runtime, а не через
    static object.

  </Accordion>

  <Accordion title="Hooks thinking policy → resolveThinkingProfile">
    **Старе** (три окремі hooks у `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: один `resolveThinkingProfile(ctx)`, що повертає
    `ProviderThinkingProfile` із канонічним `id`, необов’язковим `label` і
    ranked list рівнів. OpenClaw автоматично downgrade-ить застарілі збережені
    значення за rank профілю.

    Реалізуйте один hook замість трьох. Legacy hooks працюють протягом
    deprecation window, але не compose-яться з profile result.

  </Accordion>

  <Accordion title="Fallback зовнішнього OAuth-провайдера → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без оголошення
    провайдера в manifest Plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у manifest Plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях "auth
    fallback" видає попередження під час runtime і буде видалений.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Пошук provider env-var → setup.providers[].envVars">
    **Старе** поле manifest: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: віддзеркальте той самий пошук env-var у `setup.providers[].envVars`
    у manifest. Це консолідує setup/status env metadata в одному місці та
    уникає запуску plugin runtime лише для відповіді на env-var lookups.

    `providerAuthEnvVars` залишається підтримуваним через adapter сумісності,
    доки deprecation window не закриється.

  </Accordion>

  <Accordion title="Реєстрація memory plugin → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик в API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі slots, один виклик реєстрації. Additive memory helpers
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачеплені.

  </Accordion>

  <Accordion title="Типи повідомлень subagent session перейменовано">
    Два legacy type aliases усе ще export-яться з `src/plugins/runtime/types.ts`:

    | Старе                         | Нове                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Runtime-метод `readSession` застарів на користь `getSessionMessages`.
    Та сама signature; старий метод викликає новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Старе**: `runtime.tasks.flow` (singular) повертав live task-flow accessor.

    **Нове**: `runtime.tasks.managedFlows` зберігає managed TaskFlow mutation
    runtime для plugins, які створюють, оновлюють, cancel-ять або запускають
    child tasks із flow. Використовуйте `runtime.tasks.flows`, коли Plugin
    потребує лише DTO-based reads.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Вбудовані factories extension → middleware agent tool-result">
    Описано вище в "Як мігрувати → Міграція Pi tool-result extensions на
    middleware". Додано тут для повноти: видалений шлях лише для Pi
    `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним runtime list у
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, re-export-нутий з `openclaw/plugin-sdk`, тепер є
    однорядковим alias для `OpenClawConfig`. Надавайте перевагу канонічній назві.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Застаріння на рівні extension (всередині bundled channel/provider plugins у
`extensions/`) відстежуються в їхніх власних barrels `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти third-party plugin і не перелічені тут. Якщо ви
споживаєте local barrel bundled plugin безпосередньо, прочитайте коментарі про
застаріння в цьому barrel перед upgrading.
</Note>

## Графік видалення

| Коли                   | Що відбувається                                                       |
| ---------------------- | -------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні видають runtime warnings                          |
| **Наступний major release** | Застарілі поверхні буде видалено; plugins, які все ще їх використовують, завершаться з помилкою |

Усі core plugins уже мігровано. External plugins мають мігрувати до наступного
major release.

## Тимчасове приглушення попереджень

Встановіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий аварійний вихід, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник imports за subpath
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення channel plugins
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення provider plugins
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — глибокий огляд архітектури
- [Manifest Plugin](/uk/plugins/manifest) — довідник schema manifest
