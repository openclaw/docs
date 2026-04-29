---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували api.registerEmbeddedExtensionFactory до OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури Plugin
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перехід із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-29T13:54:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbc2569e5116d168151c34b31392df87be2b30f67de7303552c9164205716f07
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури Plugin
з вузькими, задокументованими імпортами. Якщо ваш plugin було створено до
нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система plugin надавала дві дуже відкриті поверхні, які дозволяли plugin імпортувати
все потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який повторно експортував десятки
  допоміжних функцій. Його було введено, щоб старі plugin на основі хуків продовжували працювати, поки
  будувалася нова архітектура plugin.
- **`openclaw/plugin-sdk/infra-runtime`** — широкий runtime-барель допоміжних засобів, який
  змішував системні події, стан heartbeat, черги доставки, допоміжні засоби fetch/proxy,
  файлові допоміжні засоби, типи схвалення й непов’язані утиліти.
- **`openclaw/plugin-sdk/config-runtime`** — широкий барель сумісності конфігурації,
  який досі містить застарілі прямі допоміжні засоби завантаження/запису під час міграційного
  вікна.
- **`openclaw/extension-api`** — міст, який надавав plugin прямий доступ до
  допоміжних засобів на боці хоста, як-от вбудований runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** — видалений хук лише для Pi у вбудованому
  plugin, який міг спостерігати за подіями embedded-runner, такими як
  `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони все ще працюють під час виконання,
але нові plugin не повинні їх використовувати, а наявні plugin мають виконати міграцію до того,
як наступний major-реліз їх видалить. API реєстрації embedded extension factory
лише для Pi було видалено; натомість використовуйте middleware результатів інструментів.

OpenClaw не видаляє й не переінтерпретовує задокументовану поведінку plugin у тій самій
зміні, яка вводить заміну. Зміни контракту, що ламають сумісність, спочатку мають пройти
через адаптер сумісності, діагностику, документацію та вікно застарівання.
Це стосується імпортів SDK, полів маніфесту, API налаштування, хуків і поведінки
runtime-реєстрації.

<Warning>
  Шар зворотної сумісності буде видалено в майбутньому major-релізі.
  Plugin, які досі імпортують із цих поверхонь, перестануть працювати, коли це станеться.
  Реєстрації embedded extension factory лише для Pi вже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт однієї допоміжної функції завантажував десятки непов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Нечітка поверхня API** — не було способу зрозуміти, які експорти стабільні, а які внутрішні

Сучасний SDK plugin це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим, самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі provider convenience seams для вбудованих каналів також видалено.
Допоміжні seams із брендингом каналу були приватними скороченнями mono-repo, а не стабільними
контрактами plugin. Натомість використовуйте вузькі загальні підшляхи SDK. Усередині робочої області
вбудованого plugin тримайте допоміжні засоби, що належать provider, у власному `api.ts` або
`runtime-api.ts` цього plugin.

Поточні приклади вбудованих provider:

- Anthropic тримає допоміжні засоби потоків, специфічні для Claude, у власному seam `api.ts` /
  `contract-api.ts`
- OpenAI тримає builders provider, допоміжні засоби моделей за замовчуванням і builders realtime provider
  у власному `api.ts`
- OpenRouter тримає builder provider і допоміжні засоби onboarding/config у власному
  `api.ts`

## Політика сумісності

Для зовнішніх plugin робота із сумісністю відбувається в такому порядку:

1. додати новий контракт
2. залишити стару поведінку, під’єднану через адаптер сумісності
3. вивести діагностику або попередження, яке називає старий шлях і заміну
4. покрити обидва шляхи тестами
5. задокументувати застарівання та шлях міграції
6. видаляти лише після оголошеного міграційного вікна, зазвичай у major-релізі

Maintainers можуть перевірити поточну чергу міграції за допомогою
`pnpm plugins:boundary-report`. Використовуйте `pnpm plugins:boundary-report:summary` для
стислих підрахунків, `--owner <id>` для одного plugin або власника сумісності, і
`pnpm plugins:boundary-report:ci`, коли CI gate має падати через прострочені
записи сумісності, міжвласницькі зарезервовані імпорти SDK або невикористані зарезервовані підшляхи SDK.
Звіт групує застарілі
записи сумісності за датою видалення, рахує локальні посилання в коді/документації,
показує міжвласницькі зарезервовані імпорти SDK і підсумовує приватний
міст SDK memory-host, щоб cleanup сумісності залишався явним, а не
покладався на ad hoc пошуки. Зарезервовані підшляхи SDK повинні мати відстежене використання власником;
невикористані зарезервовані helper exports слід видалити з публічного SDK.

Якщо поле маніфесту досі приймається, автори plugin можуть продовжувати його використовувати, доки
документація й діагностика не скажуть інше. Новий код має віддавати перевагу задокументованій
заміні, але наявні plugin не повинні ламатися під час звичайних minor-релізів.

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть runtime-допоміжні засоби завантаження/запису конфігурації">
    Вбудовані plugin мають припинити прямі виклики
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Віддавайте перевагу конфігурації, яку
    вже було передано в активний шлях виклику. Довготривалі handlers, яким потрібен
    поточний snapshot процесу, можуть використовувати `api.runtime.config.current()`. Довготривалі
    інструменти агента мають використовувати `ctx.getRuntimeConfig()` контексту інструмента всередині
    `execute`, щоб інструмент, створений до запису конфігурації, все одно бачив оновлену
    runtime-конфігурацію.

    Записи конфігурації мають проходити через транзакційні допоміжні засоби й вибирати
    політику після запису:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Використовуйте `afterWrite: { mode: "restart", reason: "..." }`, коли викликач знає,
    що зміна потребує чистого перезапуску gateway, і
    `afterWrite: { mode: "none", reason: "..." }` лише тоді, коли викликач володіє
    подальшою дією й навмисно хоче придушити reload planner.
    Результати мутації містять типізований підсумок `followUp` для тестів і логування;
    gateway залишається відповідальним за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються застарілими допоміжними засобами сумісності
    для зовнішніх plugin протягом міграційного вікна й попереджають один раз із
    кодом сумісності `runtime-config-load-write`. Вбудовані plugin і runtime-код репозиторію
    захищені scanner guardrails у
    `pnpm check:deprecated-internal-config-api` і
    `pnpm check:no-runtime-action-load-config`: нове production-використання plugin
    відразу падає, прямі записи конфігурації падають, методи gateway server мають використовувати
    runtime snapshot запиту, runtime channel send/action/client helpers
    мають отримувати конфігурацію зі своєї межі, а довготривалі runtime-модулі мають
    нуль дозволених ambient-викликів `loadConfig()`.

    Новий код plugin також має уникати імпорту широкого
    compatibility barrel `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    підшлях SDK, що відповідає завданню:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, як-от `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Assertions уже завантаженої конфігурації та пошук plugin-entry config | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного runtime snapshot | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Допоміжні засоби session store | `openclaw/plugin-sdk/session-store-runtime` |
    | Конфігурація таблиці Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime-допоміжні засоби group policy | `openclaw/plugin-sdk/runtime-group-policy` |
    | Розв’язання secret input | `openclaw/plugin-sdk/secret-input-runtime` |
    | Перевизначення model/session | `openclaw/plugin-sdk/model-session-runtime` |

    Вбудовані plugin та їхні тести scanner-guarded проти широкого
    barrel, щоб імпорти й mocks залишалися локальними до потрібної їм поведінки. Широкий
    barrel досі існує для зовнішньої сумісності, але новий код не повинен
    залежати від нього.

  </Step>

  <Step title="Перенесіть Pi tool-result extensions на middleware">
    Вбудовані plugin мають замінити обробники tool-result
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

    Одночасно оновіть маніфест plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Зовнішні plugin не можуть реєструвати tool-result middleware, бо воно може
    переписувати високодовірений output інструмента до того, як його побачить модель.

  </Step>

  <Step title="Перенесіть approval-native handlers на capability facts">
    Plugin каналів із підтримкою approvals тепер відкривають native approval behavior через
    `approvalCapability.nativeRuntime` плюс спільний runtime-context registry.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть специфічні для approval auth/delivery зі старого wiring `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` видалено з публічного контракту channel-plugin;
      перенесіть поля delivery/native/render на `approvalCapability`
    - `plugin.auth` залишається лише для flows login/logout каналу; approval auth
      hooks там більше не читаються core
    - Реєструйте runtime-об’єкти, що належать каналу, як-от clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте notices reroute, що належать plugin, із native approval handlers;
      core тепер володіє notices routed-elsewhere з фактичних результатів доставки
    - Під час передавання `channelRuntime` у `createChannelManager(...)` надайте
      справжню surface `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Див. `/plugins/sdk-channel-plugins` для поточної структури approval capability.

  </Step>

  <Step title="Перевірте fallback-поведінку Windows wrapper">
    Якщо ваш plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані Windows
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

    Якщо ваш викликач не покладається навмисно на shell fallback, не встановлюйте
    `allowShellFallback` і натомість обробіть thrown error.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Пошукайте у своєму plugin імпорти з будь-якої застарілої поверхні:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть вузькими імпортами">
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

    Для допоміжних засобів на боці хоста використовуйте injected plugin runtime замість прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Та сама схема застосовується до інших застарілих допоміжних функцій мосту:

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
    сумісності, але новий код має імпортувати сфокусовану поверхню допоміжних функцій, яка
    йому фактично потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Допоміжні функції черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Допоміжні функції подій Heartbeat і видимості | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Спорожнення черги очікуваних доставок | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Кеші дедуплікації в пам'яті | `openclaw/plugin-sdk/dedupe-runtime` |
    | Допоміжні функції безпечних локальних шляхів до файлів/медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-aware fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Допоміжні функції проксі та захищеного fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політик диспетчера SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запиту/вирішення затвердження | `openclaw/plugin-sdk/approval-runtime` |
    | Допоміжні функції корисного навантаження відповіді затвердження та команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Допоміжні функції форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Допоміжні функції безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена конкурентність асинхронних задач | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Процесно-локальне асинхронне блокування | `openclaw/plugin-sdk/async-lock-runtime` |
    | Файлові блокування | `openclaw/plugin-sdk/file-lock` |

    Для вбудованих plugins scanner захищає від `infra-runtime`, тому код репозиторію
    не може повернутися до широкого barrel.

  </Step>

  <Step title="Мігруйте допоміжні функції маршрутів каналів">
    Новий код маршрутів каналів має використовувати `openclaw/plugin-sdk/channel-route`.
    Старі назви route-key і comparable-target залишаються сумісними
    псевдонімами під час міграційного вікна, але нові plugins мають використовувати назви маршрутів,
    які прямо описують поведінку:

    | Стара допоміжна функція | Сучасна допоміжна функція |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Сучасні допоміжні функції маршрутів узгоджено нормалізують `{ channel, to, accountId, threadId }`
    для нативних затверджень, приглушення відповідей, дедуплікації вхідних повідомлень,
    доставки cron і маршрутизації сеансів. Якщо ваш plugin має власну граматику цільових об'єктів,
    використовуйте `resolveChannelRouteTargetWithParser(...)`, щоб адаптувати цей
    парсер до того самого контракту цільового об'єкта маршруту.

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
  | Шлях імпорту | Призначення | Ключові експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний помічник точки входу Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий загальний реекспорт для визначень/будівників точок входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Помічник точки входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення й будівники точок входу каналу | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні помічники майстра налаштування | Запити списку дозволених, будівники стану налаштування |
  | `plugin-sdk/setup-runtime` | Runtime-помічники часу налаштування | Безпечні для імпорту адаптери патчів налаштування, помічники приміток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Помічники адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Помічники інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Помічники кількох облікових записів | Помічники списку облікових записів/конфігурації/шлюзу дій |
  | `plugin-sdk/account-id` | Помічники ID облікового запису | `DEFAULT_ACCOUNT_ID`, нормалізація ID облікового запису |
  | `plugin-sdk/account-resolution` | Помічники пошуку облікового запису | Помічники пошуку облікового запису та резервного варіанта за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі помічники облікових записів | Помічники списку облікових записів/дій з обліковим записом |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви парування DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді, введення тексту та зв’язування доставки джерела | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Будівники схем конфігурації | Лише спільні примітиви схеми конфігурації каналу та загальний будівник |
  | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації в комплекті | Лише підтримувані OpenClaw Plugin у комплекті; нові Plugin мають визначати локальні для Plugin схеми |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі схеми конфігурації в комплекті | Лише сумісний псевдонім; використовуйте `plugin-sdk/bundled-channel-config-schema` для підтримуваних Plugin у комплекті |
  | `plugin-sdk/telegram-command-config` | Помічники конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики групи/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Помічники стану облікового запису та життєвого циклу потоку чернетки | `createAccountStatusSink`, помічники фіналізації попереднього перегляду чернетки |
  | `plugin-sdk/inbound-envelope` | Помічники вхідного конверта | Спільні помічники маршруту й будівника конверта |
  | `plugin-sdk/inbound-reply-dispatch` | Помічники вхідної відповіді | Спільні помічники запису й диспетчеризації |
  | `plugin-sdk/messaging-targets` | Розбір цілі повідомлення | Помічники розбору/зіставлення цілі |
  | `plugin-sdk/outbound-media` | Помічники вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Помічники залежностей вихідного надсилання | Легкий пошук `resolveOutboundSendDep` без імпорту повного вихідного runtime |
  | `plugin-sdk/outbound-runtime` | Помічники вихідного runtime | Помічники вихідної доставки, делегата ідентичності/надсилання, сеансу, форматування та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Помічники прив’язки потоку | Помічники життєвого циклу й адаптера прив’язки потоку |
  | `plugin-sdk/agent-media-payload` | Помічники застарілих payload медіа | Будівник payload медіа агента для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застаріла сумісна прокладка | Лише утиліти runtime застарілого каналу |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі runtime-помічники | Помічники runtime/логування/резервного копіювання/встановлення Plugin |
  | `plugin-sdk/runtime-env` | Вузькі помічники runtime-середовища | Помічники логера/runtime-середовища, тайм-ауту, повтору та backoff |
  | `plugin-sdk/plugin-runtime` | Спільні runtime-помічники Plugin | Помічники команд/хуків/http/інтерактивних функцій Plugin |
  | `plugin-sdk/hook-runtime` | Помічники конвеєра хуків | Спільні помічники конвеєра Webhook/внутрішніх хуків |
  | `plugin-sdk/lazy-runtime` | Помічники лінивого runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Помічники процесів | Спільні помічники exec |
  | `plugin-sdk/cli-runtime` | Runtime-помічники CLI | Форматування команд, очікування, помічники версій |
  | `plugin-sdk/gateway-runtime` | Помічники Gateway | Клієнт Gateway, помічник запуску готовності циклу подій і помічники патчів стану каналу |
  | `plugin-sdk/config-runtime` | Застаріла сумісна прокладка конфігурації | Надавайте перевагу `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Помічники команд Telegram | Стабільні щодо fallback помічники перевірки команд Telegram, коли поверхня контракту Telegram у комплекті недоступна |
  | `plugin-sdk/approval-runtime` | Помічники запитів підтвердження | Payload підтвердження exec/Plugin, помічники можливостей/профілю підтвердження, нативна маршрутизація/ runtime підтвердження та форматування шляху структурованого відображення підтвердження |
  | `plugin-sdk/approval-auth-runtime` | Помічники авторизації підтвердження | Визначення затверджувача, авторизація дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Помічники клієнта підтвердження | Нативні помічники профілю/фільтра підтвердження exec |
  | `plugin-sdk/approval-delivery-runtime` | Помічники доставки підтвердження | Нативні адаптери можливостей/доставки підтвердження |
  | `plugin-sdk/approval-gateway-runtime` | Помічники Gateway підтвердження | Спільний помічник визначення Gateway для підтвердження |
  | `plugin-sdk/approval-handler-adapter-runtime` | Помічники адаптера підтвердження | Легкі помічники завантаження нативного адаптера підтвердження для гарячих точок входу каналу |
  | `plugin-sdk/approval-handler-runtime` | Помічники обробника підтвердження | Ширші runtime-помічники обробника підтвердження; надавайте перевагу вужчим адаптерним/Gateway межам, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Помічники цілі підтвердження | Нативні помічники прив’язки цілі/облікового запису підтвердження |
  | `plugin-sdk/approval-reply-runtime` | Помічники відповіді підтвердження | Помічники payload відповіді підтвердження exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Помічники runtime-контексту каналу | Загальні помічники реєстрації/отримання/спостереження runtime-контексту каналу |
  | `plugin-sdk/security-runtime` | Помічники безпеки | Спільні помічники довіри, шлюзу DM, зовнішнього вмісту та збору секретів |
  | `plugin-sdk/ssrf-policy` | Помічники політики SSRF | Помічники списку дозволених хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Runtime-помічники SSRF | Закріплений диспетчер, захищений fetch, помічники політики SSRF |
  | `plugin-sdk/system-event-runtime` | Помічники системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Помічники Heartbeat | Помічники подій Heartbeat і видимості |
  | `plugin-sdk/delivery-queue-runtime` | Помічники черги доставки | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Помічники активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Помічники дедуплікації | In-memory кеші дедуплікації |
  | `plugin-sdk/file-access-runtime` | Помічники доступу до файлів | Помічники безпечних шляхів локальних файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Помічники готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Помічники обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Помічники діагностичного шлюзу | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Помічники форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, помічники графа помилок |
  | `plugin-sdk/fetch-runtime` | Помічники обгорнутого fetch/proxy | `resolveFetch`, помічники proxy, помічники опцій EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Помічники нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Помічники повторів | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування списку дозволених | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Мапінг вводу списку дозволених | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Помічники шлюзу команд і командної поверхні | `resolveControlCommandGate`, помічники авторизації відправника, помічники реєстру команд, зокрема форматування меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери стану/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір вводу секретів | Помічники вводу секретів |
  | `plugin-sdk/webhook-ingress` | Помічники запитів Webhook | Утиліти цілі Webhook |
  | `plugin-sdk/webhook-request-guards` | Помічники захисту тіла Webhook | Помічники читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповідей | Вхідна диспетчеризація, Heartbeat, планувальник відповідей, поділ на частини |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі помічники диспетчеризації відповідей | Фіналізація, диспетчеризація провайдера та помічники міток розмов |
  | `plugin-sdk/reply-history` | Помічники історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Помічники частин відповіді | Помічники поділу тексту/markdown на частини |
  | `plugin-sdk/session-store-runtime` | Помічники сховища сеансів | Помічники шляху сховища та updated-at |
  | `plugin-sdk/state-paths` | Помічники шляхів стану | Помічники каталогів стану та OAuth |
  | `plugin-sdk/routing` | Помічники маршрутизації/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, помічники нормалізації session-key |
  | `plugin-sdk/status-helpers` | Помічники стану каналу | Будівники зведень стану каналу/облікового запису, стандартні значення runtime-стану, помічники метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Помічники розпізнавача цілі | Спільні помічники розпізнавача цілі |
  | `plugin-sdk/string-normalization-runtime` | Помічники нормалізації рядків | Помічники нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Помічники URL запиту | Видобування рядкових URL з подібних до запиту вхідних даних |
  | `plugin-sdk/run-command` | Помічники команд із таймером | Виконавець команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Читачі параметрів | Спільні читачі параметрів інструментів/CLI |
  | `plugin-sdk/tool-payload` | Видобування payload інструмента | Видобування нормалізованих payload з об’єктів результатів інструмента |
  | `plugin-sdk/tool-send` | Видобування надсилання інструмента | Видобування канонічних полів цілі надсилання з аргументів інструмента |
  | `plugin-sdk/temp-path` | Помічники тимчасових шляхів | Спільні помічники шляхів для тимчасових завантажень |
  | `plugin-sdk/logging-core` | Помічники журналювання | Помічники підсистемного журналювання та редагування |
  | `plugin-sdk/markdown-table-runtime` | Помічники Markdown-таблиць | Помічники режиму Markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи відповідей на повідомлення | Типи корисного навантаження відповіді |
  | `plugin-sdk/provider-setup` | Добірні помічники налаштування локальних/самостійно розгорнутих провайдерів | Помічники виявлення/налаштування самостійно розгорнутих провайдерів |
  | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані помічники налаштування OpenAI-сумісних самостійно розгорнутих провайдерів | Ті самі помічники виявлення/налаштування самостійно розгорнутих провайдерів |
  | `plugin-sdk/provider-auth-runtime` | Помічники автентифікації провайдера під час виконання | Помічники визначення API-ключа під час виконання |
  | `plugin-sdk/provider-auth-api-key` | Помічники налаштування API-ключа провайдера | Помічники онбордингу API-ключа/запису профілю |
  | `plugin-sdk/provider-auth-result` | Помічники результату автентифікації провайдера | Стандартний збирач результату автентифікації OAuth |
  | `plugin-sdk/provider-auth-login` | Помічники інтерактивного входу провайдера | Спільні помічники інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Помічники вибору провайдера | Вибір налаштованого або автоматичного провайдера та об’єднання сирої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Помічники env-var провайдера | Помічники пошуку env-var автентифікації провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні помічники моделі/відтворення провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні збирачі політик відтворення, помічники кінцевих точок провайдера та помічники нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні помічники каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу провайдера | Помічники конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Помічники HTTP провайдера | Загальні помічники можливостей HTTP/кінцевих точок провайдера, зокрема помічники multipart-форми для аудіотранскрипції |
  | `plugin-sdk/provider-web-fetch` | Помічники web-fetch провайдера | Помічники реєстрації/кешу провайдера web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Помічники конфігурації web-search провайдера | Вузькі помічники конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення plugin-enable |
  | `plugin-sdk/provider-web-search-contract` | Помічники контракту web-search провайдера | Вузькі помічники контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і обмежені за областю сетери/гетери облікових даних |
  | `plugin-sdk/provider-web-search` | Помічники web-search провайдера | Помічники реєстрації/кешу/середовища виконання провайдера web-search |
  | `plugin-sdk/provider-tools` | Помічники сумісності інструментів/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також помічники сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Помічники використання провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші помічники використання провайдера |
  | `plugin-sdk/provider-stream` | Помічники обгорток потоку провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку та спільні помічники обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Помічники транспорту провайдера | Нативні помічники транспорту провайдера, як-от захищений fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні помічники медіа | Помічники отримання/перетворення/збереження медіа, визначення розмірів відео на основі ffprobe та збирачі корисного навантаження медіа |
  | `plugin-sdk/media-generation-runtime` | Спільні помічники генерації медіа | Спільні помічники відмовостійкості, вибір кандидатів і повідомлення про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Помічники розуміння медіа | Типи провайдера розуміння медіа плюс експорти помічників зображень/аудіо для провайдерів |
  | `plugin-sdk/text-runtime` | Спільні помічники тексту | Вилучення видимого для асистента тексту, помічники рендерингу/поділу на частини/таблиць Markdown, помічники редагування, помічники directive-tag, утиліти безпечного тексту та пов’язані помічники тексту/журналювання |
  | `plugin-sdk/text-chunking` | Помічники поділу тексту на частини | Помічник поділу вихідного тексту на частини |
  | `plugin-sdk/speech` | Помічники мовлення | Типи провайдера мовлення плюс помічники директив, реєстру й валідації для провайдерів, а також OpenAI-сумісний збирач TTS |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдера мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Помічники транскрипції в реальному часі | Типи провайдера, помічники реєстру та спільний помічник сеансу WebSocket |
  | `plugin-sdk/realtime-voice` | Помічники голосу в реальному часі | Типи провайдера, помічники реєстру/визначення та помічники мостових сеансів |
  | `plugin-sdk/image-generation` | Помічники генерації зображень | Типи провайдера генерації зображень плюс помічники ресурсів зображень/data URL і OpenAI-сумісний збирач провайдера зображень |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, відмовостійкість, автентифікація та помічники реєстру |
  | `plugin-sdk/music-generation` | Помічники генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, помічники відмовостійкості, пошук провайдера та розбір model-ref |
  | `plugin-sdk/video-generation` | Помічники генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, помічники відмовостійкості, пошук провайдера та розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Помічники інтерактивної відповіді | Нормалізація/скорочення корисного навантаження інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви схеми конфігурації каналу |
  | `plugin-sdk/channel-config-writes` | Помічники запису конфігурації каналу | Помічники авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула каналу | Спільні експорти преамбули Plugin каналу |
  | `plugin-sdk/channel-status` | Помічники стану каналу | Спільні помічники знімка/зведення стану каналу |
  | `plugin-sdk/allowlist-config-edit` | Помічники конфігурації allowlist | Помічники редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Помічники доступу до груп | Спільні помічники рішень щодо доступу до груп |
  | `plugin-sdk/direct-dm` | Помічники Direct-DM | Спільні помічники автентифікації/захисту Direct-DM |
  | `plugin-sdk/extension-shared` | Спільні помічники розширення | Примітиви пасивного каналу/стану та помічників ambient proxy |
  | `plugin-sdk/webhook-targets` | Помічники цілей Webhook | Реєстр цілей Webhook і помічники встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Помічники шляхів Webhook | Помічники нормалізації шляхів Webhook |
  | `plugin-sdk/web-media` | Спільні помічники вебмедіа | Помічники завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів SDK Plugin |
  | `plugin-sdk/memory-core` | Вбудовані помічники memory-core | Поверхня помічників менеджера пам’яті/конфігурації/файлів/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад середовища виконання рушія пам’яті | Фасад середовища виконання індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Foundation-рушій хоста пам’яті | Експорти foundation-рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embedding хоста пам’яті | Контракти embedding пам’яті, доступ до реєстру, локальний провайдер і загальні помічники batch/remote; конкретні віддалені провайдери містяться у своїх власних plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-рушій хоста пам’яті | Експорти QMD-рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам’яті | Експорти рушія сховища хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні помічники хоста пам’яті | Мультимодальні помічники хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Помічники запитів хоста пам’яті | Помічники запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Помічники секретів хоста пам’яті | Помічники секретів хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Помічники журналу подій хоста пам’яті | Помічники журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Помічники стану хоста пам’яті | Помічники стану хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | Середовище виконання CLI хоста пам’яті | Помічники середовища виконання CLI хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Середовище виконання ядра хоста пам’яті | Помічники середовища виконання ядра хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Помічники файлів/середовища виконання хоста пам’яті | Помічники файлів/середовища виконання хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім середовища виконання ядра хоста пам’яті | Вендорно-нейтральний псевдонім для помічників середовища виконання ядра хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Вендорно-нейтральний псевдонім для помічників журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/середовища виконання хоста пам’яті | Вендорно-нейтральний псевдонім для помічників файлів/середовища виконання хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Помічники керованого Markdown | Спільні помічники керованого Markdown для plugins, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку active memory | Лінивий фасад середовища виконання менеджера пошуку active-memory |
  | `plugin-sdk/memory-host-status` | Псевдонім стану хоста пам’яті | Вендорно-нейтральний псевдонім для помічників стану хоста пам’яті |
  | `plugin-sdk/testing` | Тестові утиліти | Застарілий широкий barrel сумісності; віддавайте перевагу сфокусованим тестовим підшляхам, як-от `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно є спільною підмножиною міграції, а не повною
поверхнею SDK. Повний список із 200+ точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні межі bundled-Plugin вилучено з публічної мапи
експортів SDK, окрім явно задокументованих фасадів сумісності, як-от
застарілий shim `plugin-sdk/discord`, збережений для опублікованого пакета
`@openclaw/discord@2026.3.13`. Специфічні для власника допоміжні засоби
розміщуються всередині пакета Plugin-власника; спільна поведінка host має
проходити через загальні контракти SDK, як-от `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.

Використовуйте найвужчий import, що відповідає завданню. Якщо ви не можете
знайти export, перевірте джерело в `src/plugin-sdk/` або запитайте
maintainers, який загальний контракт має ним володіти.

## Активні застарілі API

Вужчі застарілі API, що застосовуються в SDK Plugin, контракті провайдера,
runtime-поверхні та manifest. Кожен із них досі працює сьогодні, але буде
вилучений у майбутньому major release. Запис під кожним пунктом зіставляє
старий API з його канонічною заміною.

<AccordionGroup>
  <Accordion title="допоміжні збирачі довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    exports — просто import із вужчого subpath. `command-auth`
    повторно експортує їх як compat stubs.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="допоміжні засоби mention gating → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    один об'єкт рішення замість двох розділених викликів.

    Нижчі channel Plugin (Slack, Discord, Matrix, MS Teams) уже перейшли.

  </Accordion>

  <Accordion title="shim runtime каналу та допоміжні засоби дій каналу">
    `openclaw/plugin-sdk/channel-runtime` є shim сумісності для старіших
    channel Plugin. Не імпортуйте його з нового коду; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації runtime
    objects.

    Допоміжні засоби `channelActions*` у `openclaw/plugin-sdk/channel-actions`
    застарілі разом із сирими exports каналу "actions". Натомість розкривайте
    capabilities через семантичну поверхню `presentation` — channel Plugin
    оголошують, що вони рендерять (cards, buttons, selects), а не які сирі
    імена actions приймають.

  </Accordion>

  <Accordion title="допоміжний tool() провайдера вебпошуку → createTool() у Plugin">
    **Старе**: factory `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в provider Plugin.
    OpenClaw більше не потребує допоміжного засобу SDK для реєстрації tool wrapper.

  </Accordion>

  <Accordion title="plaintext channel envelopes → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плоского plaintext prompt
    envelope з inbound channel messages.

    **Нове**: `BodyForAgent` плюс структуровані блоки user-context. Channel
    Plugin додають routing metadata (thread, topic, reply-to, reactions) як
    типізовані поля замість конкатенації їх у prompt string. Допоміжний засіб
    `formatAgentEnvelope(...)` досі підтримується для synthesized
    assistant-facing envelopes, але inbound plaintext envelopes поступово
    виводяться з ужитку.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який
    користувацький channel Plugin, що постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="типи provider discovery → типи provider catalog">
    Чотири aliases типів discovery тепер є тонкими wrappers над типами
    catalog-епохи:

    | Старий alias              | Новий тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс legacy статичний bag `ProviderCapabilities` — provider Plugin
    мають використовувати явні provider hooks, як-от `buildReplayPolicy`,
    `normalizeToolSchemas` і `wrapStreamFn`, замість статичного об'єкта.

  </Accordion>

  <Accordion title="hooks політики thinking → resolveThinkingProfile">
    **Старе** (три окремі hooks у `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: один `resolveThinkingProfile(ctx)`, що повертає
    `ProviderThinkingProfile` з канонічним `id`, необов'язковим `label` і
    ранжованим списком levels. OpenClaw автоматично понижує застарілі
    збережені значення за rank профілю.

    Реалізуйте один hook замість трьох. Legacy hooks продовжують працювати
    протягом вікна застарівання, але не компонуються з результатом профілю.

  </Accordion>

  <Accordion title="fallback зовнішнього OAuth provider → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без оголошення
    провайдера в plugin manifest.

    **Нове**: оголосіть `contracts.externalAuthProviders` у plugin manifest
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях "auth
    fallback" виводить попередження під час runtime і буде вилучений.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="пошук env-var провайдера → setup.providers[].envVars">
    **Старе** поле manifest: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: віддзеркальте той самий пошук env-var у `setup.providers[].envVars`
    у manifest. Це консолідує setup/status env metadata в одному місці та
    уникає запуску plugin runtime лише для відповіді на env-var lookups.

    `providerAuthEnvVars` залишається підтримуваним через adapter сумісності,
    доки не закриється вікно застарівання.

  </Accordion>

  <Accordion title="реєстрація memory Plugin → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик в API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі slots, один реєстраційний виклик. Additive memory helpers
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачеплені.

  </Accordion>

  <Accordion title="типи subagent session messages перейменовано">
    Два legacy aliases типів досі експортуються з `src/plugins/runtime/types.ts`:

    | Старе                         | Нове                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Runtime-метод `readSession` застарілий на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Старе**: `runtime.tasks.flow` (однина) повертав live task-flow accessor.

    **Нове**: `runtime.tasks.managedFlows` зберігає managed TaskFlow mutation
    runtime для Plugin, які створюють, оновлюють, скасовують або запускають
    child tasks із flow. Використовуйте `runtime.tasks.flows`, коли Plugin
    потребує лише DTO-based reads.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="embedded extension factories → agent tool-result middleware">
    Розглянуто вище в "Як мігрувати → Мігруйте Pi tool-result extensions на
    middleware". Додано тут для повноти: вилучений шлях лише для Pi
    `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime
    у `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, повторно експортований з `openclaw/plugin-sdk`, тепер є
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
Застарілі API рівня extension (усередині bundled channel/provider Plugin під
`extensions/`) відстежуються у власних barrels `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх Plugin і не перелічені тут. Якщо ви
споживаєте local barrel bundled Plugin напряму, прочитайте коментарі про
застарівання в цьому barrel перед оновленням.
</Note>

## Графік вилучення

| Коли                   | Що відбувається                                                        |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні виводять runtime warnings                            |
| **Наступний major release** | Застарілі поверхні буде вилучено; Plugin, які досі їх використовують, завершаться помилкою |

Усі core Plugin уже мігровано. Зовнішні Plugin мають мігрувати до наступного
major release.

## Тимчасове придушення попереджень

Установіть ці environment variables, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий аварійний шлях, а не постійне рішення.

## Пов'язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник import за subpath
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення channel Plugin
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення provider Plugin
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — глибокий розбір архітектури
- [Plugin Manifest](/uk/plugins/manifest) — довідник схеми manifest
