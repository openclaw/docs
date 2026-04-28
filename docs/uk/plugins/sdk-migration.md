---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували api.registerEmbeddedExtensionFactory до OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури Plugin
    - Ви підтримуєте зовнішній Plugin для OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-28T11:20:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f102c3632f6b51fcc007a53a3e3c4d47dbbee8e86a8d49b758cff38925fbbf1
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури Plugin
із точковими, задокументованими імпортами. Якщо ваш Plugin був створений до
нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система Plugin надавала дві надто відкриті поверхні, які дозволяли Plugin імпортувати
усе потрібне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — один імпорт, який повторно експортував десятки
  допоміжних функцій. Його було введено, щоб підтримувати роботу старіших Plugin на основі хуків,
  поки будувалася нова архітектура Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** — широкий набір runtime-допоміжних функцій,
  який змішував системні події, стан Heartbeat, черги доставлення, допоміжні функції fetch/proxy,
  файлові допоміжні функції, типи підтверджень і непов’язані утиліти.
- **`openclaw/plugin-sdk/config-runtime`** — широкий набір для сумісності конфігурації,
  який досі містить застарілі прямі допоміжні функції load/write під час
  міграційного вікна.
- **`openclaw/extension-api`** — міст, який давав Plugin прямий доступ до
  host-side допоміжних функцій, як-от вбудований runner агента.
- **`api.registerEmbeddedExtensionFactory(...)`** — видалений bundled hook лише для Pi,
  який міг спостерігати події embedded-runner, як-от
  `tool_result`.

Широкі поверхні імпорту тепер **застарілі**. Вони досі працюють під час виконання,
але нові Plugin не повинні їх використовувати, а наявні Plugin мають мігрувати до того,
як наступний major-реліз їх видалить. API реєстрації embedded extension factory
лише для Pi було видалено; натомість використовуйте middleware результатів інструментів.

OpenClaw не видаляє й не переінтерпретовує задокументовану поведінку Plugin у тій самій
зміні, яка вводить заміну. Зміни контракту, що ламають сумісність, мають спочатку пройти
через адаптер сумісності, діагностику, документацію та вікно застарівання.
Це стосується імпортів SDK, полів маніфесту, API налаштування, хуків і поведінки
runtime-реєстрації.

<Warning>
  Шар зворотної сумісності буде видалено в майбутньому major-релізі.
  Plugin, які досі імпортують із цих поверхонь, зламаються, коли це станеться.
  Реєстрації embedded extension factory лише для Pi вже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт однієї допоміжної функції завантажував десятки непов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Нечітка поверхня API** — не було способу визначити, які експорти стабільні, а які внутрішні

Сучасний SDK Plugin виправляє це: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Legacy provider convenience seams для bundled channels також видалено.
Channel-branded допоміжні seams були приватними скороченнями mono-repo, а не стабільними
контрактами Plugin. Використовуйте натомість вузькі generic subpaths SDK. Усередині bundled
робочого простору Plugin тримайте provider-owned допоміжні функції у власному `api.ts` або
`runtime-api.ts` цього Plugin.

Поточні bundled provider приклади:

- Anthropic тримає Claude-specific stream helpers у власному `api.ts` /
  `contract-api.ts` seam
- OpenAI тримає provider builders, default-model helpers і realtime provider
  builders у власному `api.ts`
- OpenRouter тримає provider builder і onboarding/config helpers у власному
  `api.ts`

## Політика сумісності

Для зовнішніх Plugin робота із сумісністю відбувається в такому порядку:

1. додайте новий контракт
2. збережіть стару поведінку, під’єднану через адаптер сумісності
3. виведіть діагностичне повідомлення або попередження, яке називає старий шлях і заміну
4. покрийте обидва шляхи тестами
5. задокументуйте застарівання та шлях міграції
6. видаляйте лише після оголошеного міграційного вікна, зазвичай у major-релізі

Maintainers можуть перевіряти поточну чергу міграції за допомогою
`pnpm plugins:boundary-report`. Використовуйте `pnpm plugins:boundary-report:summary` для
стислих лічильників, `--owner <id>` для одного Plugin або власника сумісності, і
`pnpm plugins:boundary-report:ci`, коли CI gate має падати через прострочені
записи сумісності, cross-owner reserved SDK imports або unused reserved SDK
subpaths. Звіт групує застарілі
записи сумісності за датою видалення, рахує локальні посилання в коді/документації,
показує cross-owner reserved SDK imports і підсумовує приватний
memory-host SDK bridge, щоб очищення сумісності залишалося явним, а не
покладалося на ad hoc пошуки. Reserved SDK subpaths повинні мати відстежене використання власником;
unused reserved helper exports слід видалити з публічного SDK.

Якщо поле маніфесту досі приймається, автори Plugin можуть продовжувати ним користуватися, доки
документація й діагностика не скажуть інше. Новий код має віддавати перевагу задокументованій
заміні, але наявні Plugin не повинні ламатися під час звичайних minor-релізів.

## Як мігрувати

<Steps>
  <Step title="Перенесіть runtime config load/write helpers">
    Bundled Plugin повинні припинити прямі виклики
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Віддавайте перевагу конфігурації, яку
    вже передано в активний шлях виклику. Довгоживучі handlers, яким потрібен
    поточний snapshot процесу, можуть використовувати `api.runtime.config.current()`. Довгоживучі
    agent tools мають використовувати `ctx.getRuntimeConfig()` з контексту інструмента всередині
    `execute`, щоб інструмент, створений до запису конфігурації, усе одно бачив оновлену
    runtime config.

    Записи конфігурації мають проходити через транзакційні допоміжні функції та вибирати
    політику після запису:

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
    follow-up і свідомо хоче приглушити reload planner.
    Результати мутації містять типізований summary `followUp` для тестів і логування;
    Gateway залишається відповідальним за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються застарілими compatibility
    helpers для зовнішніх Plugin під час міграційного вікна й один раз попереджають із
    compatibility code `runtime-config-load-write`. Bundled Plugin і runtime-код репозиторію
    захищені scanner guardrails у
    `pnpm check:deprecated-internal-config-api` і
    `pnpm check:no-runtime-action-load-config`: нове production-використання в Plugin
    одразу падає, прямі записи конфігурації падають, методи gateway server мають використовувати
    request runtime snapshot, runtime channel send/action/client helpers
    мають отримувати конфігурацію зі своєї межі, а довгоживучі runtime modules мають
    нуль дозволених ambient викликів `loadConfig()`.

    Новий код Plugin також має уникати імпорту широкого
    compatibility barrel `openclaw/plugin-sdk/config-runtime`. Використовуйте вузький
    subpath SDK, що відповідає задачі:

    | Потреба | Імпорт |
    | --- | --- |
    | Типи конфігурації, як-от `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Assertions для вже завантаженої конфігурації та lookup конфігурації plugin-entry | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Читання поточного runtime snapshot | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Записи конфігурації | `openclaw/plugin-sdk/config-mutation` |
    | Допоміжні функції session store | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown table config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Group policy runtime helpers | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret input resolution | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/session overrides | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled Plugin та їхні тести scanner-guarded проти широкого
    barrel, щоб імпорти й mocks залишалися локальними до потрібної їм поведінки. Широкий
    barrel досі існує для зовнішньої сумісності, але новий код не повинен
    від нього залежати.

  </Step>

  <Step title="Перенесіть Pi tool-result extensions на middleware">
    Bundled Plugin мають замінити tool-result handlers
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

    Зовнішні Plugin не можуть реєструвати tool-result middleware, бо воно може
    переписувати high-trust tool output до того, як модель його побачить.

  </Step>

  <Step title="Перенесіть approval-native handlers на capability facts">
    Approval-capable channel Plugin тепер відкривають native approval behavior через
    `approvalCapability.nativeRuntime` плюс спільний runtime-context registry.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть approval-specific auth/delivery із legacy wiring `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` видалено з публічного контракту channel-plugin;
      перенесіть delivery/native/render fields на `approvalCapability`
    - `plugin.auth` залишається лише для channel login/logout flows; approval auth
      hooks там core більше не читає
    - Реєструйте channel-owned runtime objects, як-от clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте plugin-owned reroute notices із native approval handlers;
      core тепер володіє routed-elsewhere notices з actual delivery results
    - Передаючи `channelRuntime` у `createChannelManager(...)`, надайте
      справжню поверхню `createPluginRuntime().channel`. Partial stubs відхиляються.

    Див. `/plugins/sdk-channel-plugins` для поточного layout approval capability.

  </Step>

  <Step title="Перевірте fallback-поведінку Windows wrapper">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, unresolved Windows
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

  <Step title="Замініть на точкові імпорти">
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

    Для host-side допоміжних функцій використовуйте injected plugin runtime замість прямого імпорту:

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
    сумісності, але новий код має імпортувати сфокусовану поверхню допоміжних
    функцій, яка йому фактично потрібна:

    | Потреба | Імпорт |
    | --- | --- |
    | Допоміжні функції черги системних подій | `openclaw/plugin-sdk/system-event-runtime` |
    | Допоміжні функції подій Heartbeat і видимості | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Очищення черги очікуваного доставлення | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Телеметрія активності каналу | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Кеші дедуплікації в пам’яті | `openclaw/plugin-sdk/dedupe-runtime` |
    | Допоміжні функції безпечних шляхів до локальних файлів і медіа | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch з урахуванням диспетчера | `openclaw/plugin-sdk/runtime-fetch` |
    | Допоміжні функції проксі та захищеного fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Типи політики SSRF-диспетчера | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Типи запиту й вирішення схвалення | `openclaw/plugin-sdk/approval-runtime` |
    | Допоміжні функції payload відповіді на схвалення та команд | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Допоміжні функції форматування помилок | `openclaw/plugin-sdk/error-runtime` |
    | Очікування готовності транспорту | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Допоміжні функції безпечних токенів | `openclaw/plugin-sdk/secure-random-runtime` |
    | Обмежена конкурентність асинхронних завдань | `openclaw/plugin-sdk/concurrency-runtime` |
    | Числове приведення | `openclaw/plugin-sdk/number-runtime` |
    | Локальне для процесу асинхронне блокування | `openclaw/plugin-sdk/async-lock-runtime` |
    | Файлові блокування | `openclaw/plugin-sdk/file-lock` |

    Вбудовані plugins захищені сканером від `infra-runtime`, тому код репозиторію
    не може повернутися до широкого barrel.

  </Step>

  <Step title="Перенесіть допоміжні функції маршрутів каналів">
    Новий код маршрутів каналів має використовувати `openclaw/plugin-sdk/channel-route`.
    Старі назви route-key і comparable-target залишаються псевдонімами для
    сумісності протягом вікна міграції, але нові plugins мають використовувати
    назви маршрутів, які прямо описують поведінку:

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
    для нативних схвалень, пригнічення відповідей, дедуплікації вхідних повідомлень,
    доставлення Cron і маршрутизації сеансів. Якщо ваш plugin має власну граматику
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

  <Accordion title="Поширена таблиця шляхів імпорту">
  | Шлях імпорту | Призначення | Основні експорти |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний модуль входу Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий узагальнений реекспорт для визначень/конструкторів входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний модуль входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Спеціалізовані визначення та конструктори входу каналу | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Запити списку дозволених, конструктори стану налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime під час налаштування | Безпечні для імпорту адаптери патчів налаштування, допоміжні засоби нотаток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку облікових записів/конфігурації/шлюзу дій |
  | `plugin-sdk/account-id` | Допоміжні засоби ідентифікатора облікового запису | `DEFAULT_ACCOUNT_ID`, нормалізація ідентифікатора облікового запису |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису | Допоміжні засоби пошуку облікового запису й резервного значення за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби облікових записів | Допоміжні засоби списку облікових записів/дій з обліковим записом |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви парування DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді, індикація набору та зв’язування доставлення джерела | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Конструктори схем конфігурації | Спільні примітиви схеми конфігурації каналу й лише універсальний конструктор |
  | `plugin-sdk/bundled-channel-config-schema` | Пакетні схеми конфігурації | Лише підтримувані OpenClaw пакетні plugins; нові plugins мають визначати локальні для plugin схеми |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі пакетні схеми конфігурації | Лише псевдонім сумісності; для підтримуваних пакетних plugins використовуйте `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Допоміжні засоби стану облікового запису та життєвого циклу потоку чернеток | `createAccountStatusSink`, допоміжні засоби фіналізації попереднього перегляду чернетки |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби вхідного конверта | Спільні допоміжні засоби маршруту й конструктора конверта |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби вхідної відповіді | Спільні допоміжні засоби запису та диспетчеризації |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Допоміжні засоби розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Допоміжні засоби залежностей вихідного надсилання | Легкий пошук `resolveOutboundSendDep` без імпорту повного вихідного runtime |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідного runtime | Допоміжні засоби вихідного доставлення, делегата ідентичності/надсилання, сесії, форматування та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби прив’язок потоків | Допоміжні засоби життєвого циклу прив’язок потоків і адаптерів |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби payload медіа | Конструктор payload медіа агента для застарілих схем полів |
  | `plugin-sdk/channel-runtime` | Застаріла прокладка сумісності | Лише застарілі утиліти runtime каналу |
  | `plugin-sdk/channel-send-result` | Типи результату надсилання | Типи результату відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/журналювання/резервного копіювання/інсталяції plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби середовища runtime | Середовище журналера/runtime, тайм-аут, повторні спроби та backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби runtime plugin | Допоміжні засоби команд/hooks/http/інтерактивності plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра hooks | Спільні допоміжні засоби Webhook/внутрішнього конвеєра hooks |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби runtime CLI | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Допоміжні засоби клієнта Gateway і патчів стану каналу |
  | `plugin-sdk/config-runtime` | Застаріла прокладка сумісності конфігурації | Надавайте перевагу `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` і `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Стабільні щодо резервного варіанта допоміжні засоби перевірки команд Telegram, коли пакетна контрактна поверхня Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби запитів схвалення | Payload схвалення exec/plugin, допоміжні засоби capability/profile схвалення, маршрутизація/runtime нативного схвалення та форматування шляху структурованого відображення схвалення |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби автентифікації схвалення | Визначення схвалювача, авторизація дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта схвалення | Допоміжні засоби нативного профілю/фільтра схвалення exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставлення схвалення | Адаптери capability/доставлення нативного схвалення |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби Gateway схвалення | Спільний допоміжний засіб визначення Gateway схвалення |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера схвалення | Легкі допоміжні засоби завантаження адаптера нативного схвалення для гарячих точок входу каналу |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника схвалення | Ширші допоміжні засоби runtime обробника схвалення; надавайте перевагу вужчим адаптерним/Gateway seams, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілі схвалення | Допоміжні засоби прив’язки нативної цілі схвалення/облікового запису |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповіді схвалення | Допоміжні засоби payload відповіді схвалення exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби runtime-контексту каналу | Універсальні допоміжні засоби реєстрації/отримання/спостереження runtime-контексту каналу |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби довіри, шлюзування DM, зовнішнього вмісту та збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби списку дозволених хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби runtime SSRF | Закріплений диспетчер, захищений fetch, допоміжні засоби політики SSRF |
  | `plugin-sdk/system-event-runtime` | Допоміжні засоби системних подій | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби Heartbeat | Допоміжні засоби подій Heartbeat і видимості |
  | `plugin-sdk/delivery-queue-runtime` | Допоміжні засоби черги доставлення | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Допоміжні засоби активності каналу | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Допоміжні засоби дедуплікації | In-memory кеші дедуплікації |
  | `plugin-sdk/file-access-runtime` | Допоміжні засоби доступу до файлів | Допоміжні засоби безпечних шляхів до локальних файлів/медіа |
  | `plugin-sdk/transport-ready-runtime` | Допоміжні засоби готовності транспорту | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичного шлюзування | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Обгорнуті допоміжні засоби fetch/proxy | `resolveFetch`, допоміжні засоби proxy |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби повторних спроб | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування списку дозволених | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Зіставлення вхідних даних списку дозволених | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Шлюзування команд і допоміжні засоби поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів |
  | `plugin-sdk/command-status` | Рендерери стану/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір введення секретів | Допоміжні засоби введення секретів |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів Webhook | Утиліти цілей Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби захисту тіла Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповіді | Вхідна диспетчеризація, heartbeat, планувальник відповіді, поділ на фрагменти |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації відповіді | Фіналізація, диспетчеризація провайдера та допоміжні засоби міток розмов |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби фрагментів відповіді | Допоміжні засоби поділу тексту/markdown на фрагменти |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій | Допоміжні засоби шляху сховища й updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогу стану та OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби маршрутизації/ключа сесії | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації ключа сесії |
  | `plugin-sdk/status-helpers` | Допоміжні засоби стану каналу | Конструктори зведень стану каналу/облікового запису, стандартні значення runtime-state, допоміжні засоби метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби визначника цілі | Спільні допоміжні засоби визначника цілі |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Виділення рядкових URL з подібних до запиту вхідних даних |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із таймером | Виконавець команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Спільні зчитувачі параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Виділення payload tool | Виділення нормалізованих payload з об’єктів результату tool |
  | `plugin-sdk/tool-send` | Виділення надсилання tool | Виділення канонічних полів цілі надсилання з аргументів tool |
  | `plugin-sdk/temp-path` | Допоміжні засоби для тимчасових шляхів | Спільні допоміжні засоби для шляхів тимчасових завантажень |
  | `plugin-sdk/logging-core` | Допоміжні засоби для журналювання | Допоміжні засоби для журналера підсистеми та редагування чутливих даних |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби для Markdown-таблиць | Допоміжні засоби для режиму Markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи відповідей на повідомлення | Типи корисного навантаження відповіді |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби для налаштування локальних/самостійно розміщених провайдерів | Допоміжні засоби для виявлення/налаштування самостійно розміщених провайдерів |
  | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби для налаштування OpenAI-сумісних самостійно розміщених провайдерів | Ті самі допоміжні засоби для виявлення/налаштування самостійно розміщених провайдерів |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби runtime-автентифікації провайдера | Допоміжні засоби runtime API для визначення API-ключа |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби для налаштування API-ключа провайдера | Допоміжні засоби для онбордингу API-ключа/запису профілю |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби для результату автентифікації провайдера | Стандартний побудовник результату OAuth-автентифікації |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного входу провайдера | Спільні допоміжні засоби для інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Допоміжні засоби вибору провайдера | Вибір налаштованого або автоматичного провайдера та злиття сирої конфігурації провайдера |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env-var провайдера | Допоміжні засоби пошуку env-var автентифікації провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби для моделей/відтворення провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політик відтворення, допоміжні засоби для кінцевих точок провайдера та допоміжні засоби нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу провайдера | Допоміжні засоби конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP провайдера | Загальні допоміжні засоби можливостей HTTP/кінцевих точок провайдера, включно з допоміжними засобами multipart-форми для транскрипції аудіо |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch провайдера | Допоміжні засоби реєстрації/кешу web-fetch провайдера |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації web-search провайдера | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення увімкнення Plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту web-search провайдера | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped сетери/гетери облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search провайдера | Допоміжні засоби реєстрації/кешу/runtime web-search провайдера |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності інструментів/схем провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика та допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби використання провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби використання провайдера |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгорток потоків провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби транспорту провайдера | Нативні допоміжні засоби транспорту провайдера, як-от захищений fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
  | `plugin-sdk/keyed-async-queue` | Впорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби для медіа | Допоміжні засоби отримання/перетворення/зберігання медіа плюс побудовники медіа-навантаження |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації медіа | Спільні допоміжні засоби failover, вибір кандидатів і повідомлення про відсутні моделі для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби розуміння медіа | Типи провайдерів розуміння медіа плюс експорти допоміжних засобів для зображень/аудіо, орієнтовані на провайдерів |
  | `plugin-sdk/text-runtime` | Спільні допоміжні засоби для тексту | Вилучення видимого для асистента тексту, допоміжні засоби рендерингу/розбиття на фрагменти/таблиць Markdown, допоміжні засоби редагування чутливих даних, допоміжні засоби тегів директив, утиліти безпечного тексту та пов’язані допоміжні засоби для тексту/журналювання |
  | `plugin-sdk/text-chunking` | Допоміжні засоби розбиття тексту на фрагменти | Допоміжний засіб розбиття вихідного тексту на фрагменти |
  | `plugin-sdk/speech` | Допоміжні засоби мовлення | Типи провайдерів мовлення плюс орієнтовані на провайдерів допоміжні засоби директив, реєстру, валідації та OpenAI-сумісний побудовник TTS |
  | `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи провайдерів мовлення, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби транскрипції в реальному часі | Типи провайдерів, допоміжні засоби реєстру та спільний допоміжний засіб WebSocket-сесії |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби голосу в реальному часі | Типи провайдерів, допоміжні засоби реєстру/визначення та допоміжні засоби bridge-сесій |
  | `plugin-sdk/image-generation` | Допоміжні засоби генерації зображень | Типи провайдерів генерації зображень плюс допоміжні засоби для ресурсів зображень/data URL і OpenAI-сумісний побудовник провайдера зображень |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, failover, автентифікація та допоміжні засоби реєстру |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи провайдера/запиту/результату генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи провайдера/запиту/результату генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивної відповіді | Нормалізація/згортання корисного навантаження інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви схеми конфігурації каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації каналу | Допоміжні засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула каналу | Експорти спільної преамбули Plugin каналу |
  | `plugin-sdk/channel-status` | Допоміжні засоби статусу каналу | Спільні допоміжні засоби snapshot/зведення статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації allowlist | Допоміжні засоби редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби групового доступу | Спільні допоміжні засоби рішень щодо групового доступу |
  | `plugin-sdk/direct-dm` | Допоміжні засоби прямих DM | Спільні допоміжні засоби автентифікації/захисту прямих DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби extension | Примітиви допоміжних засобів passive-channel/status і ambient proxy |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляхів Webhook | Допоміжні засоби нормалізації шляхів Webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби веб-медіа | Допоміжні засоби завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Реекспорт Zod | Реекспортований `zod` для споживачів plugin SDK |
  | `plugin-sdk/memory-core` | Вбудовані допоміжні засоби memory-core | Поверхня допоміжних засобів менеджера/конфігурації/файлів/CLI пам’яті |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime-фасад рушія пам’яті | Runtime-фасад індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій хоста пам’яті | Експорти базового рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embeddings хоста пам’яті | Контракти embeddings пам’яті, доступ до реєстру, локальний провайдер і загальні допоміжні засоби batch/remote; конкретні віддалені провайдери живуть у своїх власних plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста пам’яті | Експорти рушія QMD хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам’яті | Експорти рушія сховища хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Допоміжні засоби multimodal хоста пам’яті | Допоміжні засоби multimodal хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті | Допоміжні засоби запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret хоста пам’яті | Допоміжні засоби secret хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті | Допоміжні засоби журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті | Допоміжні засоби статусу хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI хоста пам’яті | Runtime-допоміжні засоби CLI хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime хоста пам’яті | Core runtime-допоміжні засоби хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті | Допоміжні засоби файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім core runtime хоста пам’яті | Vendor-neutral псевдонім для core runtime-допоміжних засобів хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Vendor-neutral псевдонім для допоміжних засобів журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime хоста пам’яті | Vendor-neutral псевдонім для допоміжних засобів файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого Markdown | Спільні допоміжні засоби керованого Markdown для plugins, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку активної пам’яті | Лінивий runtime-фасад search-manager активної пам’яті |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу хоста пам’яті | Vendor-neutral псевдонім для допоміжних засобів статусу хоста пам’яті |
  | `plugin-sdk/testing` | Тестові утиліти | Застарілий широкий barrel сумісності; віддавайте перевагу сфокусованим тестовим підшляхам, як-от `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` і `plugin-sdk/test-fixtures` |
</Accordion>

Ця таблиця навмисно містить спільну підмножину для міграції, а не повну
поверхню SDK. Повний список із понад 200 точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Зарезервовані допоміжні seams для вбудованих Plugin вилучено з публічної мапи
експортів SDK. Допоміжні засоби, специфічні для власника, містяться всередині
пакета Plugin-власника; спільна поведінка хоста має проходити через загальні
контракти SDK, як-от `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` і
`plugin-sdk/plugin-config-runtime`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо не можете
знайти експорт, перевірте джерело в `src/plugin-sdk/` або запитайте
супровідників, якому загальному контракту він має належати.

## Активні застарілі API

Вужчі застарілі API, що застосовуються до SDK Plugin, контракту провайдера,
runtime-поверхні та manifest. Кожен із них досі працює сьогодні, але буде
вилучений у майбутньому major-релізі. Запис під кожним пунктом зіставляє старий
API з його канонічною заміною.

<AccordionGroup>
  <Accordion title="помічники довідки command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    експорти — просто імпортовані з вужчого subpath. `command-auth`
    повторно експортує їх як compat stubs.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="помічники mention gating → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    єдиний об'єкт рішення замість двох окремих викликів.

    Низхідні канальні Plugin-и (Slack, Discord, Matrix, MS Teams) уже
    перемкнулися.

  </Accordion>

  <Accordion title="shim runtime каналу та помічники дій каналу">
    `openclaw/plugin-sdk/channel-runtime` — це compatibility shim для старіших
    канальних Plugin-ів. Не імпортуйте його з нового коду; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації runtime-об'єктів.

    Помічники `channelActions*` у `openclaw/plugin-sdk/channel-actions`
    застаріли разом із сирими експортами канальних "actions". Натомість
    відкривайте capabilities через семантичну поверхню `presentation` —
    канальні Plugin-и оголошують, що вони рендерять (картки, кнопки, select-и),
    а не які сирі назви дій вони приймають.

  </Accordion>

  <Accordion title="помічник tool() провайдера вебпошуку → createTool() у Plugin">
    **Старе**: фабрика `tool()` з `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо в провайдерному Plugin.
    OpenClaw більше не потребує помічника SDK для реєстрації обгортки tool.

  </Accordion>

  <Accordion title="plaintext envelopes каналу → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плоского plaintext
    prompt envelope з вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки контексту користувача.
    Канальні Plugin-и додають routing metadata (thread, topic, reply-to,
    reactions) як типізовані поля замість конкатенації їх у рядок prompt. Помічник
    `formatAgentEnvelope(...)` досі підтримується для синтезованих
    assistant-facing envelopes, але вхідні plaintext envelopes поступово
    вилучаються.

    Зачеплені області: `inbound_claim`, `message_received` і будь-який
    користувацький канальний Plugin, який постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="типи discovery провайдера → типи catalog провайдера">
    Чотири псевдоніми типів discovery тепер є тонкими обгортками над типами
    епохи catalog:

    | Старий псевдонім          | Новий тип                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Плюс застарілий статичний набір `ProviderCapabilities` — провайдерні
    Plugin-и мають додавати capability facts через runtime-контракт провайдера,
    а не через статичний об'єкт.

  </Accordion>

  <Accordion title="hooks політики thinking → resolveThinkingProfile">
    **Старе** (три окремі hooks у `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: один `resolveThinkingProfile(ctx)`, який повертає
    `ProviderThinkingProfile` з канонічним `id`, необов'язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично понижує застарілі збережені
    значення за рангом profile.

    Реалізуйте один hook замість трьох. Застарілі hooks продовжують працювати
    протягом вікна застарівання, але не компонуються з результатом profile.

  </Accordion>

  <Accordion title="fallback зовнішнього OAuth-провайдера → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без оголошення
    провайдера в manifest Plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у manifest Plugin
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
    у manifest. Це об'єднує metadata env для налаштування/статусу в одному місці
    й уникає запуску runtime Plugin лише для відповіді на пошуки env-var.

    `providerAuthEnvVars` залишається підтримуваним через compatibility adapter,
    доки не закриється вікно застарівання.

  </Accordion>

  <Accordion title="реєстрація Plugin пам'яті → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик у memory-state API —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Адитивні помічники пам'яті
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачеплені.

  </Accordion>

  <Accordion title="типи повідомлень сесії subagent перейменовано">
    Два застарілі псевдоніми типів досі експортуються з `src/plugins/runtime/types.ts`:

    | Старе                         | Нове                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Runtime-метод `readSession` застарів на користь `getSessionMessages`.
    Сигнатура та сама; старий метод делегує виклик новому.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Старе**: `runtime.tasks.flow` (в однині) повертав live accessor task-flow.

    **Нове**: `runtime.tasks.managedFlows` зберігає runtime мутації керованого
    TaskFlow для Plugin-ів, які створюють, оновлюють, скасовують або запускають
    дочірні завдання з flow. Використовуйте `runtime.tasks.flows`, коли Plugin
    потребує лише DTO-based читань.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="фабрики вбудованих extension → middleware результатів tool агента">
    Описано вище в розділі "Як мігрувати → Міграція extensions результатів tool
    Pi до middleware". Додано тут для повноти: вилучений шлях лише для Pi
    `api.registerEmbeddedExtensionFactory(...)` замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime у
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="псевдонім OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, повторно експортований з `openclaw/plugin-sdk`, тепер є
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
Застарілі API рівня extension (усередині вбудованих канальних/провайдерних
Plugin-ів у `extensions/`) відстежуються у власних barrels `api.ts` і
`runtime-api.ts`. Вони не впливають на контракти сторонніх Plugin-ів і не
перелічені тут. Якщо ви споживаєте локальний barrel вбудованого Plugin
безпосередньо, перед оновленням прочитайте коментарі про застарівання в цьому
barrel.
</Note>

## Графік вилучення

| Коли                   | Що відбувається                                                       |
| ---------------------- | -------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні виводять runtime-попередження                     |
| **Наступний major-реліз** | Застарілі поверхні буде вилучено; Plugin-и, які досі їх використовують, не працюватимуть |

Усі core Plugin-и вже мігровано. Зовнішні Plugin-и мають мігрувати до
наступного major-релізу.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища під час роботи над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий аварійний обхід, а не постійне рішення.

## Пов'язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повна довідка імпортів subpath
- [Канальні Plugin-и](/uk/plugins/sdk-channel-plugins) — створення канальних Plugin-ів
- [Провайдерні Plugin-и](/uk/plugins/sdk-provider-plugins) — створення провайдерних Plugin-ів
- [Внутрішня архітектура Plugin](/uk/plugins/architecture) — поглиблений огляд архітектури
- [Manifest Plugin](/uk/plugins/manifest) — довідка зі схеми manifest
