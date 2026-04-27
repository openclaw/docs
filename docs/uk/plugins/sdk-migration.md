---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви використовували `api.registerEmbeddedExtensionFactory` до OpenClaw 2026.4.25
    - Ви оновлюєте Plugin до сучасної архітектури plugin
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-27T12:53:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40dd590e9a9a2a340da9b6ecba5dd471713552a214aa7fd24970db2b47a4a04c
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури plugin
із точковими, задокументованими imports. Якщо ваш plugin було створено до
нової архітектури, цей посібник допоможе виконати міграцію.

## Що змінюється

Стара система plugin надавала дві широкі поверхні, які дозволяли plugins імпортувати
будь-що, що їм потрібно, з єдиної точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний import, який повторно експортував десятки
  helpers. Його було запроваджено, щоб старі hook-based plugins продовжували працювати, поки
  будувалася нова архітектура plugin.
- **`openclaw/extension-api`** — міст, який давав plugins прямий доступ до
  helper на боці host, таких як embedded runner agent.
- **`api.registerEmbeddedExtensionFactory(...)`** — вилучений hook вбудованого
  extension лише для Pi, який міг спостерігати події embedded runner, такі як
  `tool_result`.

Ці широкі поверхні import тепер **застарілі**. Вони все ще працюють у runtime,
але нові plugins не повинні їх використовувати, а наявні plugins мають перейти
до того, як наступний major release їх вилучить. API реєстрації embedded extension factory лише для Pi вже вилучено; замість нього використовуйте middleware для результатів tools.

OpenClaw не вилучає і не переосмислює задокументовану поведінку plugin у тій самій
зміні, яка вводить заміну. Зміни контрактів, що ламають сумісність, спочатку мають пройти
через адаптер сумісності, diagnostics, документацію та вікно застарівання.
Це стосується imports SDK, полів manifest, API setup, hooks і поведінки реєстрації в runtime.

<Warning>
  Шар зворотної сумісності буде вилучено в одному з майбутніх major release.
  Plugins, які все ще імпортують із цих поверхонь, зламаються, коли це станеться.
  Реєстрації embedded extension factory лише для Pi уже більше не завантажуються.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — import одного helper завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів import
- **Нечітка поверхня API** — не було способу визначити, які exports стабільні, а які внутрішні

Сучасний Plugin SDK це виправляє: кожен шлях import (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим, самодостатнім модулем із чіткою метою та задокументованим контрактом.

Застарілі зручні seams provider для bundled channels також зникли.
Branded helper seams каналів були приватними скороченнями mono-repo, а не стабільними
контрактами plugin. Натомість використовуйте вузькі загальні subpath SDK. Усередині
робочого простору bundled plugin тримайте helper, що належать provider, у власному
`api.ts` або `runtime-api.ts` цього plugin.

Поточні приклади bundled provider:

- Anthropic тримає helpers потоків, специфічні для Claude, у власному seam `api.ts` /
  `contract-api.ts`
- OpenAI тримає builders provider, helpers моделей за замовчуванням і realtime builders provider
  у власному `api.ts`
- OpenRouter тримає builder provider і helpers onboarding/config у власному
  `api.ts`

## Політика сумісності

Для зовнішніх plugins робота із сумісністю йде в такому порядку:

1. додати новий контракт
2. зберегти стару поведінку, підключену через адаптер сумісності
3. вивести diagnostics або попередження з назвою старого шляху та заміни
4. покрити обидва шляхи тестами
5. задокументувати застарівання та шлях міграції
6. вилучати лише після оголошеного вікна міграції, зазвичай у major release

Якщо поле manifest усе ще приймається, автори plugin можуть і далі його використовувати,
доки документація і diagnostics не скажуть інакше. Новий код має віддавати перевагу
задокументованій заміні, але наявні plugins не повинні ламатися під час звичайних minor
release.

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть helpers завантаження/запису runtime config">
    Bundled plugins мають припинити прямі виклики
    `api.runtime.config.loadConfig()` і
    `api.runtime.config.writeConfigFile(...)`. Надавайте перевагу config, яку вже
    передано в активний шлях виклику. Довгоживучі handlers, яким потрібен
    поточний snapshot процесу, можуть використовувати `api.runtime.config.current()`. Довгоживучі
    tools agent мають використовувати `ctx.getRuntimeConfig()` із контексту tool всередині
    `execute`, щоб tool, створений до запису config, усе одно бачив оновлену
    runtime config.

    Записи config мають проходити через транзакційні helpers і вибирати
    політику після запису:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Використовуйте `afterWrite: { mode: "restart", reason: "..." }`, коли виклик точно знає,
    що зміна потребує чистого перезапуску gateway, а
    `afterWrite: { mode: "none", reason: "..." }` — лише коли виклик керує
    подальшими діями й навмисно хоче приглушити планувальник перезавантаження.
    Результати мутації містять типізований підсумок `followUp` для тестів і логування;
    gateway як і раніше відповідає за застосування або планування перезапуску.
    `loadConfig` і `writeConfigFile` залишаються застарілими helpers сумісності
    для зовнішніх plugins протягом вікна міграції та попереджають один раз під час
    виклику. Bundled plugins і runtime-код репозиторію захищені
    scanner guardrails у `pnpm check:deprecated-internal-config-api`: нове production-використання
    plugin завершується помилкою одразу, прямі записи config завершуються помилкою, gateway server
    methods мають використовувати snapshot runtime запиту, а довгоживучі runtime
    modules мають нульовий дозволений рівень ambient-викликів `loadConfig()`.

  </Step>

  <Step title="Перенесіть Pi tool-result extensions на middleware">
    Bundled plugins мають замінити handlers результатів tools
    `api.registerEmbeddedExtensionFactory(...)` лише для Pi на
    runtime-neutral middleware.

    ```typescript
    // Динамічні tools runtime Pi і Codex
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Одночасно оновіть manifest plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Зовнішні plugins не можуть реєструвати middleware для результатів tools, тому що воно може
    переписувати високодовірений вивід tools до того, як його побачить модель.

  </Step>

  <Step title="Перенесіть approval-native handlers на capability facts">
    Plugins каналів із підтримкою approvals тепер розкривають нативну поведінку approval через
    `approvalCapability.nativeRuntime` плюс спільний реєстр runtime-context.

    Основні зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/delivery, специфічні для approval, зі застарілого зв’язування `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` вилучено з публічного
      контракту channel-plugin; перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` лишається лише для потоків login/logout каналу; hooks auth approval
      там більше не читаються ядром
    - Реєструйте runtime-об’єкти, що належать каналу, такі як clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте повідомлення reroute, що належать plugin, із native handlers approval;
      ядро тепер відповідає за routed-elsewhere notices на основі реальних результатів delivery
    - Під час передавання `channelRuntime` до `createChannelManager(...)` надавайте
      справжню поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Актуальну структуру approval capability див. в `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Перевірте fallback-поведінку wrapper у Windows">
    Якщо ваш plugin використовує `openclaw/plugin-sdk/windows-spawn`, невизначені wrapper Windows
    `.cmd`/`.bat` тепер завершуються без fallback, якщо ви явно не передасте
    `allowShellFallback: true`.

    ```typescript
    // Раніше
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Тепер
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Установлюйте це лише для довірених сумісних викликів, які навмисно
      // приймають fallback через shell.
      allowShellFallback: true,
    });
    ```

    Якщо ваш виклик навмисно не покладається на fallback shell, не встановлюйте
    `allowShellFallback` і натомість обробляйте згенеровану помилку.

  </Step>

  <Step title="Знайдіть застарілі imports">
    Пошукайте у своєму plugin imports із будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на точкові imports">
    Кожен export зі старої поверхні відповідає конкретному сучасному шляху import:

    ```typescript
    // Раніше (застарілий шар зворотної сумісності)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Тепер (сучасні точкові imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Для helper на боці host використовуйте injected runtime plugin замість
    прямого import:

    ```typescript
    // Раніше (застарілий міст extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Тепер (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується до інших helpers застарілого bridge:

    | Старий import | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers сховища сесій | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Зберіть і протестуйте">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Довідник шляхів import

  <Accordion title="Таблиця поширених шляхів import">
  | Шлях import | Призначення | Ключові exports |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Канонічний helper точки входу plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий umbrella re-export для визначень/builders входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої schema config | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper точки входу для одного provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Точкові визначення й builders входу каналу | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні helpers майстра setup | Prompt allowlist, builders статусу setup |
  | `plugin-sdk/setup-runtime` | Helpers runtime під час setup | Import-safe адаптери patch setup, helpers приміток lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxy |
  | `plugin-sdk/setup-adapter-runtime` | Helpers адаптера setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers інструментів setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers для кількох облікових записів | Helpers списку/конфігурації облікових записів/воріт дій |
  | `plugin-sdk/account-id` | Helpers account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Helpers пошуку облікового запису | Helpers пошуку облікового запису + fallback до типового |
  | `plugin-sdk/account-helpers` | Вузькі helpers облікового запису | Helpers списку облікових записів/дій із обліковими записами |
  | `plugin-sdk/channel-setup` | Адаптери майстра setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви DM pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Підключення префікса reply + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів config | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders schema config | Спільні примітиви schema config каналу і лише generic builder |
  | `plugin-sdk/channel-config-schema-legacy` | Застарілі bundled schema config | Лише bundled compatibility; нові plugins мають визначати локальні schema plugin |
  | `plugin-sdk/telegram-command-config` | Helpers config команд Telegram | Нормалізація назв команд, обрізання опису, валідація дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики Group/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpers життєвого циклу статусу облікового запису і draft stream | `createAccountStatusSink`, helpers фіналізації попереднього перегляду draft |
  | `plugin-sdk/inbound-envelope` | Helpers вхідного envelope | Спільні helpers побудови route + envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers вхідного reply | Спільні helpers запису й dispatch |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Helpers розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Helpers вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-send-deps` | Helpers залежностей вихідного надсилання | Полегшений lookup `resolveOutboundSendDep` без import повного outbound runtime |
  | `plugin-sdk/outbound-runtime` | Helpers outbound runtime | Helpers доставлення outbound, identity/send delegate, сесії, форматування й планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Helpers thread-binding | Helpers життєвого циклу й адаптера thread-binding |
  | `plugin-sdk/agent-media-payload` | Застарілі helpers media payload | Builder media payload agent для застарілих layout полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти channel runtime |
  | `plugin-sdk/channel-send-result` | Типи результату надсилання | Типи результату reply |
  | `plugin-sdk/runtime-store` | Постійне сховище plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі helpers runtime | Helpers runtime/logging/backup/install plugin |
  | `plugin-sdk/runtime-env` | Вузькі helpers runtime env | Logger/runtime env, helpers timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні helpers runtime plugin | Helpers команд/hooks/http/interactive для plugin |
  | `plugin-sdk/hook-runtime` | Helpers конвеєра hook | Спільні helpers конвеєра Webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Helpers lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers процесів | Спільні helpers exec |
  | `plugin-sdk/cli-runtime` | Helpers CLI runtime | Форматування команд, waits, helpers версій |
  | `plugin-sdk/gateway-runtime` | Helpers Gateway | Helpers клієнта Gateway і patch статусу каналу |
  | `plugin-sdk/config-runtime` | Helpers config | Helpers завантаження/запису config |
  | `plugin-sdk/telegram-command-config` | Helpers команд Telegram | Fallback-stable валідація команд Telegram, коли surface контракту bundled Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Helpers prompt approval | Payload approval exec/plugin, helpers capability/profile approval, native helpers routing/runtime approval і форматування структурованого шляху відображення approval |
  | `plugin-sdk/approval-auth-runtime` | Helpers auth approval | Визначення approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Helpers клієнта approval | Helpers profile/filter для native exec approval |
  | `plugin-sdk/approval-delivery-runtime` | Helpers доставлення approval | Native адаптери capability/delivery approval |
  | `plugin-sdk/approval-gateway-runtime` | Helpers Gateway approval | Спільний helper визначення Gateway approval |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers адаптера approval | Полегшені helpers завантаження native adapter approval для гарячих точок входу каналу |
  | `plugin-sdk/approval-handler-runtime` | Helpers handler approval | Ширші helpers runtime handler approval; надавайте перевагу вужчим seams adapter/gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Helpers цілей approval | Helpers native binding цілі/облікового запису approval |
  | `plugin-sdk/approval-reply-runtime` | Helpers reply approval | Helpers payload reply для approval exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers runtime-context каналу | Загальні helpers register/get/watch для runtime-context каналу |
  | `plugin-sdk/security-runtime` | Helpers безпеки | Спільні helpers trust, DM gating, external-content і collection secret |
  | `plugin-sdk/ssrf-policy` | Helpers політики SSRF | Helpers allowlist хостів і політики private-network |
  | `plugin-sdk/ssrf-runtime` | Helpers runtime SSRF | Helpers pinned-dispatcher, guarded fetch, політики SSRF |
  | `plugin-sdk/collection-runtime` | Helpers обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers воріт diagnostics | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, helpers графа помилок |
  | `plugin-sdk/fetch-runtime` | Helpers wrapped fetch/proxy | `resolveFetch`, helpers proxy |
  | `plugin-sdk/host-runtime` | Helpers нормалізації host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers retry | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення входів allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Ворота команд і helpers поверхні команд | `resolveControlCommandGate`, helpers авторизації відправника, helpers реєстру команд, включно з форматуванням меню динамічних аргументів |
  | `plugin-sdk/command-status` | Renderers статусу/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Розбір secret input | Helpers secret input |
  | `plugin-sdk/webhook-ingress` | Helpers запитів Webhook | Утиліти цілі Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers guard для тіла Webhook | Helpers читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime reply | Inbound dispatch, Heartbeat, планувальник reply, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі helpers dispatch reply | Helpers finalize, dispatch provider і labels conversation |
  | `plugin-sdk/reply-history` | Helpers історії reply | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань reply | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers chunk reply | Helpers chunking тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers сховища сесій | Шлях сховища + helpers updated-at |
  | `plugin-sdk/state-paths` | Helpers шляхів стану | Helpers каталогів state і OAuth |
  | `plugin-sdk/routing` | Helpers routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers нормалізації session-key |
  | `plugin-sdk/status-helpers` | Helpers статусу каналу | Builders зведення статусу каналу/облікового запису, типові значення runtime-state, helpers метаданих issue |
  | `plugin-sdk/target-resolver-runtime` | Helpers визначення цілі | Спільні helpers визначення цілі |
  | `plugin-sdk/string-normalization-runtime` | Helpers нормалізації рядків | Helpers нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Helpers URL запиту | Витягування рядкових URL із вхідних даних, подібних до request |
  | `plugin-sdk/run-command` | Helpers команд із тайм-аутом | Виконавець команд із тайм-аутом і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Читачі параметрів | Поширені читачі параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload tool | Витягування нормалізованих payload з об’єктів результатів tool |
  | `plugin-sdk/tool-send` | Витягування надсилання tool | Витягування канонічних полів цілі надсилання з аргументів tool |
  | `plugin-sdk/temp-path` | Helpers тимчасових шляхів | Спільні helpers шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Helpers логування | Helpers logger підсистеми та редагування |
  | `plugin-sdk/markdown-table-runtime` | Helpers markdown-таблиць | Helpers режиму markdown-таблиць |
  | `plugin-sdk/reply-payload` | Типи reply повідомлень | Типи payload reply |
  | `plugin-sdk/provider-setup` | Кураторські helpers setup локального/self-hosted provider | Helpers виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/self-hosted-provider-setup` | Точкові helpers setup self-hosted provider, сумісного з OpenAI | Ті самі helpers виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/provider-auth-runtime` | Helpers runtime auth provider | Helpers визначення ключа API у runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpers setup ключа API provider | Helpers onboarding/запису профілю для ключа API |
  | `plugin-sdk/provider-auth-result` | Helpers auth-result provider | Стандартний builder OAuth auth-result |
  | `plugin-sdk/provider-auth-login` | Helpers інтерактивного входу provider | Спільні helpers інтерактивного входу |
  | `plugin-sdk/provider-selection-runtime` | Helpers вибору provider | Вибір налаштованого або автоматичного provider і злиття сирої конфігурації provider |
| `plugin-sdk/provider-env-vars` | Helpers env-var provider | Helpers пошуку auth env-var provider |
| `plugin-sdk/provider-model-shared` | Спільні helpers provider model/replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builders політики replay, helpers endpoint provider і helpers нормалізації model-id |
| `plugin-sdk/provider-catalog-shared` | Спільні helpers каталогу provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
| `plugin-sdk/provider-onboard` | Patches onboarding provider | Helpers конфігурації onboarding |
| `plugin-sdk/provider-http` | Helpers HTTP provider | Загальні helpers HTTP/можливостей endpoint provider, включно з helpers multipart form для транскрипції аудіо |
| `plugin-sdk/provider-web-fetch` | Helpers web-fetch provider | Helpers реєстрації/кешу provider web-fetch |
| `plugin-sdk/provider-web-search-config-contract` | Helpers config web-search provider | Вузькі helpers config/credentials web-search для providers, яким не потрібне підключення enable plugin |
| `plugin-sdk/provider-web-search-contract` | Helpers контракту web-search provider | Вузькі helpers контракту config/credentials web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і setters/getters credentials з обмеженою областю дії |
| `plugin-sdk/provider-web-search` | Helpers web-search provider | Helpers реєстрації/кешу/runtime provider web-search |
| `plugin-sdk/provider-tools` | Helpers compat tool/schema provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення schema Gemini + diagnostics і helpers compat xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
| `plugin-sdk/provider-usage` | Helpers використання provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші helpers використання provider |
| `plugin-sdk/provider-stream` | Helpers wrapper потоку provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи wrapper потоку і спільні helpers wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
| `plugin-sdk/provider-transport-runtime` | Helpers транспорту provider | Нативні helpers транспорту provider, такі як guarded fetch, перетворення повідомлень транспорту і потоки подій writable transport |
| `plugin-sdk/keyed-async-queue` | Упорядкована async queue | `KeyedAsyncQueue` |
| `plugin-sdk/media-runtime` | Спільні helpers медіа | Helpers fetch/transform/store медіа плюс builders media payload |
| `plugin-sdk/media-generation-runtime` | Спільні helpers media-generation | Спільні helpers failover, вибір candidate і повідомлення про відсутню модель для генерації зображень/відео/музики |
| `plugin-sdk/media-understanding` | Helpers media-understanding | Типи providers media understanding плюс exports helpers image/audio для providers |
| `plugin-sdk/text-runtime` | Спільні text helpers | Видалення тексту, видимого assistant, helpers render/chunking/table для markdown, helpers редагування, helpers тегів директив, утиліти safe-text і пов’язані helpers text/logging |
| `plugin-sdk/text-chunking` | Helpers chunking тексту | Helper chunking вихідного тексту |
| `plugin-sdk/speech` | Helpers мовлення | Типи providers мовлення плюс helpers директив, реєстру й валідації для providers |
| `plugin-sdk/speech-core` | Спільне ядро мовлення | Типи providers мовлення, реєстр, директиви, нормалізація |
| `plugin-sdk/realtime-transcription` | Helpers транскрипції в реальному часі | Типи providers, helpers реєстру та спільний helper сесії WebSocket |
| `plugin-sdk/realtime-voice` | Helpers голосу в реальному часі | Типи providers, helpers реєстру/визначення та helpers bridge session |
| `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, helpers failover, auth і реєстру |
| `plugin-sdk/music-generation` | Helpers генерації музики | Типи provider/request/result для генерації музики |
| `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, helpers failover, lookup provider і розбір model-ref |
| `plugin-sdk/video-generation` | Helpers генерації відео | Типи provider/request/result для генерації відео |
| `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, helpers failover, lookup provider і розбір model-ref |
| `plugin-sdk/interactive-runtime` | Helpers інтерактивної reply | Нормалізація/редукція payload інтерактивної reply |
| `plugin-sdk/channel-config-primitives` | Примітиви config каналу | Вузькі примітиви channel config-schema |
| `plugin-sdk/channel-config-writes` | Helpers запису config каналу | Helpers авторизації запису config каналу |
| `plugin-sdk/channel-plugin-common` | Спільний прелюд каналу | Спільні exports прелюду channel plugin |
| `plugin-sdk/channel-status` | Helpers статусу каналу | Спільні helpers snapshot/summary статусу каналу |
| `plugin-sdk/allowlist-config-edit` | Helpers config allowlist | Helpers редагування/читання config allowlist |
| `plugin-sdk/group-access` | Helpers доступу до group | Спільні helpers рішень доступу до group |
| `plugin-sdk/direct-dm` | Helpers direct-DM | Спільні helpers auth/guard для direct-DM |
| `plugin-sdk/extension-shared` | Спільні helpers extension | Примітиви passive-channel/status і ambient proxy helper |
| `plugin-sdk/webhook-targets` | Helpers цілей Webhook | Реєстр цілей Webhook і helpers встановлення route |
| `plugin-sdk/webhook-path` | Helpers шляху Webhook | Helpers нормалізації шляху Webhook |
| `plugin-sdk/web-media` | Спільні helpers web media | Helpers завантаження віддалених/локальних медіа |
| `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів Plugin SDK |
| `plugin-sdk/memory-core` | Вбудовані helpers memory-core | Поверхня helpers memory manager/config/file/CLI |
| `plugin-sdk/memory-core-engine-runtime` | Фасад runtime engine пам’яті | Фасад runtime індексу/пошуку пам’яті |
| `plugin-sdk/memory-core-host-engine-foundation` | Foundation engine host пам’яті | Exports foundation engine host пам’яті |
| `plugin-sdk/memory-core-host-engine-embeddings` | Embedding engine host пам’яті | Контракти embedding пам’яті, доступ до реєстру, локальний provider і загальні helpers batch/remote; конкретні remote providers живуть у своїх plugins-власниках |
| `plugin-sdk/memory-core-host-engine-qmd` | QMD engine host пам’яті | Exports QMD engine host пам’яті |
| `plugin-sdk/memory-core-host-engine-storage` | Storage engine host пам’яті | Exports storage engine host пам’яті |
| `plugin-sdk/memory-core-host-multimodal` | Multimodal helpers host пам’яті | Multimodal helpers host пам’яті |
| `plugin-sdk/memory-core-host-query` | Helpers query host пам’яті | Helpers query host пам’яті |
| `plugin-sdk/memory-core-host-secret` | Helpers secret host пам’яті | Helpers secret host пам’яті |
| `plugin-sdk/memory-core-host-events` | Helpers журналу подій host пам’яті | Helpers журналу подій host пам’яті |
| `plugin-sdk/memory-core-host-status` | Helpers статусу host пам’яті | Helpers статусу host пам’яті |
| `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime host пам’яті | Helpers CLI runtime host пам’яті |
| `plugin-sdk/memory-core-host-runtime-core` | Core runtime host пам’яті | Helpers core runtime host пам’яті |
| `plugin-sdk/memory-core-host-runtime-files` | Helpers файлів/runtime host пам’яті | Helpers файлів/runtime host пам’яті |
| `plugin-sdk/memory-host-core` | Alias core runtime host пам’яті | Нейтральний до vendor alias для helpers core runtime host пам’яті |
| `plugin-sdk/memory-host-events` | Alias журналу подій host пам’яті | Нейтральний до vendor alias для helpers журналу подій host пам’яті |
| `plugin-sdk/memory-host-files` | Alias файлів/runtime host пам’яті | Нейтральний до vendor alias для helpers файлів/runtime host пам’яті |
| `plugin-sdk/memory-host-markdown` | Helpers керованого markdown | Спільні helpers керованого markdown для plugins, суміжних із пам’яттю |
| `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий фасад runtime search-manager для Active Memory |
| `plugin-sdk/memory-host-status` | Alias статусу host пам’яті | Нейтральний до vendor alias для helpers статусу host пам’яті |
| `plugin-sdk/memory-lancedb` | Вбудовані helpers memory-lancedb | Поверхня helpers memory-lancedb |
| `plugin-sdk/testing` | Тестові утиліти | Helpers і mocks для тестування |
</Accordion>

Ця таблиця навмисно охоплює поширену підмножину для міграції, а не всю поверхню SDK.
Повний список із понад 200 точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще містить деякі seams helper для bundled plugin, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
підтримки bundled plugin і сумісності, але навмисно
опущені з поширеної таблиці міграції й не є рекомендованою ціллю для
нового коду plugin.

Те саме правило застосовується до інших сімейств bundled-helper, таких як:

- helpers підтримки browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- bundled helper/plugin surfaces, такі як `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` зараз надає вузьку поверхню helper для token:
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий import, який відповідає завданню. Якщо ви не можете знайти export,
перевірте джерело в `src/plugin-sdk/` або запитайте в Discord.

## Активні застарівання

Вужчі застарівання, що застосовуються в Plugin SDK, контракті provider,
поверхні runtime і manifest. Кожне з них усе ще працює сьогодні, але буде вилучене
в одному з майбутніх major release. Запис під кожним пунктом відображає старий API
на його канонічну заміну.

<AccordionGroup>
  <Accordion title="builders help command-auth → command-status">
    **Старе (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Нове (`openclaw/plugin-sdk/command-status`)**: ті самі сигнатури, ті самі
    exports — лише import із вужчого subpath. `command-auth`
    повторно експортує їх як compat stubs.

    ```typescript
    // Раніше
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Тепер
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Helpers gating згадок → resolveInboundMentionDecision">
    **Старе**: `resolveInboundMentionRequirement({ facts, policy })` і
    `shouldDropInboundForMention(...)` з
    `openclaw/plugin-sdk/channel-inbound` або
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Нове**: `resolveInboundMentionDecision({ facts, policy })` — повертає
    один об’єкт рішення замість двох окремих викликів.

    Downstream channel plugins (Slack, Discord, Matrix, MS Teams) уже
    перейшли.

  </Accordion>

  <Accordion title="Shim channel runtime і helpers дій каналу">
    `openclaw/plugin-sdk/channel-runtime` — це shim сумісності для старіших
    channel plugins. Не імпортуйте його в новому коді; використовуйте
    `openclaw/plugin-sdk/channel-runtime-context` для реєстрації об’єктів
    runtime.

    Helpers `channelActions*` у `openclaw/plugin-sdk/channel-actions` є
    застарілими разом із сирими exports дій каналу. Натомість розкривайте
    capabilities через семантичну поверхню `presentation` — channel plugins
    оголошують, що вони рендерять (cards, buttons, selects), а не які сирі
    назви actions вони приймають.

  </Accordion>

  <Accordion title="Helper tool() provider web search → createTool() у plugin">
    **Старе**: фабрика `tool()` із `openclaw/plugin-sdk/provider-web-search`.

    **Нове**: реалізуйте `createTool(...)` безпосередньо у plugin provider.
    OpenClaw більше не потребує helper SDK для реєстрації wrapper tool.

  </Accordion>

  <Accordion title="Текстові plaintext envelopes каналу → BodyForAgent">
    **Старе**: `formatInboundEnvelope(...)` (і
    `ChannelMessageForAgent.channelEnvelope`) для побудови плаского plaintext prompt
    envelope з вхідних повідомлень каналу.

    **Нове**: `BodyForAgent` плюс структуровані блоки user-context. Channel
    plugins додають метадані маршрутизації (thread, topic, reply-to, reactions) як
    типізовані поля замість конкатенації їх у рядок prompt. Helper
    `formatAgentEnvelope(...)` усе ще підтримується для синтезованих envelope,
    орієнтованих на assistant, але вхідні plaintext envelope поступово
    виводяться з ужитку.

    Зачеплені ділянки: `inbound_claim`, `message_received` і будь-який custom
    channel plugin, який постобробляв текст `channelEnvelope`.

  </Accordion>

  <Accordion title="Типи виявлення provider → типи каталогу provider">
    Чотири alias типів виявлення тепер є тонкими wrapper над типами
    епохи каталогу:

    | Старий alias               | Новий тип                |
    | -------------------------- | ------------------------ |
    | `ProviderDiscoveryOrder`   | `ProviderCatalogOrder`   |
    | `ProviderDiscoveryContext` | `ProviderCatalogContext` |
    | `ProviderDiscoveryResult`  | `ProviderCatalogResult`  |
    | `ProviderPluginDiscovery`  | `ProviderPluginCatalog`  |

    Плюс застарілий статичний набір `ProviderCapabilities` — plugins provider
    мають додавати capability facts через контракт runtime provider,
    а не через статичний об’єкт.

  </Accordion>

  <Accordion title="Hooks політики Thinking → resolveThinkingProfile">
    **Старе** (три окремі hooks у `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` і
    `resolveDefaultThinkingLevel(ctx)`.

    **Нове**: один `resolveThinkingProfile(ctx)`, що повертає
    `ProviderThinkingProfile` з канонічним `id`, необов’язковим `label` і
    ранжованим списком рівнів. OpenClaw автоматично знижує застарілі збережені значення за рангом профілю.

    Реалізуйте один hook замість трьох. Застарілі hooks і далі працюють протягом
    вікна застарівання, але не комбінуються з результатом профілю.

  </Accordion>

  <Accordion title="Fallback зовнішнього OAuth provider → contracts.externalAuthProviders">
    **Старе**: реалізація `resolveExternalOAuthProfiles(...)` без
    оголошення provider у manifest plugin.

    **Нове**: оголосіть `contracts.externalAuthProviders` у manifest plugin
    **і** реалізуйте `resolveExternalAuthProfiles(...)`. Старий шлях
    «auth fallback» виводить попередження в runtime і буде вилучений.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Пошук env-var provider → setup.providers[].envVars">
    **Старе** поле manifest: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Нове**: продублюйте той самий пошук env-var у `setup.providers[].envVars`
    в manifest. Це об’єднує метадані env setup/status в одному
    місці та дозволяє уникнути запуску runtime plugin лише для відповіді на
    пошук env-var.

    `providerAuthEnvVars` і далі підтримується через адаптер сумісності
    до завершення вікна застарівання.

  </Accordion>

  <Accordion title="Реєстрація plugin пам’яті → registerMemoryCapability">
    **Старе**: три окремі виклики —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Нове**: один виклик у API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Ті самі слоти, один виклик реєстрації. Додаткові helpers пам’яті
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) не зачеплено.

  </Accordion>

  <Accordion title="Типи повідомлень сесії subagent перейменовано">
    Два застарілі alias типів усе ще експортуються з `src/plugins/runtime/types.ts`:

    | Старе                       | Нове                            |
    | --------------------------- | ------------------------------- |
    | `SubagentReadSessionParams` | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult` | `SubagentGetSessionMessagesResult` |

    Метод runtime `readSession` є застарілим на користь
    `getSessionMessages`. Та сама сигнатура; старий метод викликає
    новий.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Старе**: `runtime.tasks.flow` (в однині) повертав живий accessor TaskFlow.

    **Нове**: `runtime.tasks.flows` (у множині) повертає DTO-based доступ до TaskFlow,
    який є import-safe і не вимагає завантаження повного runtime завдань.

    ```typescript
    // Раніше
    const flow = api.runtime.tasks.flow(ctx);
    // Тепер
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → middleware результатів tools agent">
    Це вже розглянуто вище в розділі «Як виконати міграцію → Перенесіть Pi tool-result extensions на
    middleware». Для повноти наведено і тут: вилучений шлях
    `api.registerEmbeddedExtensionFactory(...)` лише для Pi замінено на
    `api.registerAgentToolResultMiddleware(...)` з явним списком runtime
    у `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType`, повторно експортований з `openclaw/plugin-sdk`, тепер є
    однорядковим alias для `OpenClawConfig`. Надавайте перевагу канонічній назві.

    ```typescript
    // Раніше
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Тепер
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Застарівання на рівні extension (усередині bundled channel/provider plugins у
`extensions/`) відстежуються всередині їхніх власних barrels `api.ts` і `runtime-api.ts`.
Вони не впливають на контракти сторонніх plugins і тут не перелічені.
Якщо ви напряму споживаєте локальний barrel bundled plugin, перед оновленням
прочитайте коментарі про застарівання в цьому barrel.
</Note>

## Часова шкала вилучення

| Коли | Що відбувається |
| --- | --- |
| **Зараз** | Застарілі поверхні виводять попередження runtime |
| **Наступний major release** | Застарілі поверхні буде вилучено; plugins, які все ще їх використовують, почнуть падати |

Усі core plugins уже перенесено. Зовнішнім plugins слід виконати міграцію
до наступного major release.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий запасний вихід, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник imports за subpath
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення channel plugins
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення provider plugins
- [Внутрішня будова Plugin](/uk/plugins/architecture) — глибокий огляд архітектури
- [Manifest Plugin](/uk/plugins/manifest) — довідник schema manifest
