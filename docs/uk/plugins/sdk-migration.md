---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви оновлюєте plugin до сучасної архітектури plugin
    - Ви підтримуєте зовнішній plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть зі застарілого шару зворотної сумісності на сучасний plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-07T18:43:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 509699c3432191a1b2e4214c66d6d620e8d13a064cb2e7b9b38460c7ea45a20d
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Міграція Plugin SDK

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної
архітектури plugin із цільовими, задокументованими імпортами. Якщо ваш plugin
було створено до появи нової архітектури, цей посібник допоможе вам
перейти на неї.

## Що змінюється

Стара система plugin надавала дві відкриті поверхні, які дозволяли plugin
імпортувати все необхідне з єдиної точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який повторно експортував
  десятки допоміжних функцій. Його було запроваджено, щоб зберегти роботу
  старіших plugin на основі hook, поки створювалася нова архітектура plugin.
- **`openclaw/extension-api`** — міст, що надавав plugin прямий доступ до
  допоміжних функцій на боці хоста, як-от вбудований засіб запуску agent.

Обидві поверхні тепер **застарілі**. Вони все ще працюють під час виконання,
але нові plugin не повинні їх використовувати, а наявним plugin слід
перейти до того, як наступний мажорний випуск їх прибере.

<Warning>
  Шар зворотної сумісності буде видалено в одному з майбутніх мажорних
  випусків. Plugins, які все ще імпортують із цих поверхонь, перестануть
  працювати, коли це станеться.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт однієї допоміжної функції завантажував десятки
  не пов’язаних між собою модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення
  циклів імпорту
- **Нечітка поверхня API** — не було способу визначити, які експорти є
  стабільними, а які внутрішніми

Сучасний plugin SDK вирішує це: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим, самодостатнім модулем із чітким призначенням і задокументованим
контрактом.

Застарілі зручні шви provider для вбудованих каналів також зникли. Імпорти
на кшталт `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
брендовані допоміжні шви каналів і
`openclaw/plugin-sdk/telegram-core` були приватними скороченнями
моно-репозиторію, а не стабільними контрактами plugin. Натомість
використовуйте вузькі загальні підшляхи SDK. Усередині робочого простору
вбудованих plugin зберігайте допоміжні функції, що належать provider, у
власному `api.ts` або `runtime-api.ts` цього plugin.

Поточні приклади вбудованих provider:

- Anthropic зберігає допоміжні функції потоку, специфічні для Claude, у
  власному шві `api.ts` / `contract-api.ts`
- OpenAI зберігає builder-и provider, допоміжні функції моделей за
  замовчуванням і builder-и realtime provider у власному `api.ts`
- OpenRouter зберігає builder provider та допоміжні функції онбордингу/конфігурації
  у власному `api.ts`

## Як перейти

<Steps>
  <Step title="Перенесіть approval-native handlers на факти можливостей">
    Plugins каналів із підтримкою approval тепер розкривають нативну поведінку
    approval через `approvalCapability.nativeRuntime` разом зі спільним
    реєстром runtime-context.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть автентифікацію/доставку, специфічні для approval, зі
      застарілого зв’язування `plugin.auth` / `plugin.approvals`
      на `approvalCapability`
    - `ChannelPlugin.approvals` видалено з публічного контракту
      channel-plugin; перенесіть поля delivery/native/render до
      `approvalCapability`
    - `plugin.auth` залишається лише для потоків входу/виходу з channel; hook
      автентифікації approval там більше не читаються ядром
    - Реєструйте runtime-об’єкти, що належать каналу, як-от clients, tokens або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте повідомлення про перенаправлення, що належать plugin, з native approval handlers;
      тепер ядро відповідає за повідомлення routed-elsewhere на основі фактичних результатів доставки
    - Під час передавання `channelRuntime` у `createChannelManager(...)` надавайте
      справжню поверхню `createPluginRuntime().channel`. Часткові stubs відхиляються.

    Поточне компонування можливостей approval дивіться в
    `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Перевірте резервну поведінку Windows wrapper">
    Якщо ваш plugin використовує `openclaw/plugin-sdk/windows-spawn`, невизначені Windows
    wrappers `.cmd`/`.bat` тепер завершуються з закритою відмовою, якщо ви явно не передасте
    `allowShellFallback: true`.

    ```typescript
    // До
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Після
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Установлюйте це лише для довірених викликів сумісності, які свідомо
      // допускають резервний перехід через shell.
      allowShellFallback: true,
    });
    ```

    Якщо ваш виклик не покладається навмисно на резервний перехід через shell,
    не встановлюйте `allowShellFallback` і натомість обробляйте згенеровану помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у своєму plugin імпорти з будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
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

    Для допоміжних функцій на боці хоста використовуйте впроваджений runtime plugin
    замість прямого імпорту:

    ```typescript
    // До (застарілий міст extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Після (впроваджений runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Такий самий шаблон застосовується й до інших застарілих допоміжних функцій моста:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | допоміжні функції сховища session | `api.runtime.agent.session.*` |

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
  | `plugin-sdk/plugin-entry` | Канонічна допоміжна функція точки входу plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий umbrella-повторний експорт для визначень/builders входу каналу | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжна функція точки входу для одного provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цільові визначення та builders входу каналу | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні функції майстра налаштування | Запити allowlist, builders стану налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні функції runtime на етапі налаштування | Безпечні для імпорту patch-adapters налаштування, допоміжні функції нотаток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні функції адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні функції інструментарію налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні функції для кількох облікових записів | Допоміжні функції списку облікових записів/конфігурації/action-gate |
  | `plugin-sdk/account-id` | Допоміжні функції account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні функції пошуку облікового запису | Допоміжні функції пошуку облікового запису + резервного значення за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні функції облікових записів | Допоміжні функції списку облікових записів/дій облікового запису |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви DM pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді + wiring індикатора набору | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders схем конфігурації | Типи схем конфігурації каналу |
  | `plugin-sdk/telegram-command-config` | Допоміжні функції конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, валідація дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики group/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Відстеження стану облікового запису | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Допоміжні функції вхідних envelope | Спільні допоміжні функції маршрутизації + побудови envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні функції вхідних відповідей | Спільні допоміжні функції запису та dispatch |
  | `plugin-sdk/messaging-targets` | Розбір messaging targets | Допоміжні функції розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні функції вихідних медіа | Спільне завантаження вихідних медіа |
  | `plugin-sdk/outbound-runtime` | Допоміжні функції вихідного runtime | Допоміжні функції outbound identity/send delegate |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні функції thread-binding | Допоміжні функції життєвого циклу thread-binding та адаптерів |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні функції media payload | Builder agent media payload для застарілих layout полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти runtime каналу |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні функції runtime | Допоміжні функції runtime/logging/backup/встановлення plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні функції середовища runtime | Logger/runtime env, timeout, retry та backoff helpers |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні функції runtime plugin | Допоміжні функції команд/hooks/http/interactive plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні функції конвеєра hook | Спільні допоміжні функції конвеєра webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Допоміжні функції lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні функції процесів | Спільні допоміжні функції exec |
  | `plugin-sdk/cli-runtime` | Допоміжні функції runtime CLI | Форматування команд, очікування, допоміжні функції версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні функції gateway | Client gateway та допоміжні функції patch статусу каналу |
  | `plugin-sdk/config-runtime` | Допоміжні функції конфігурації | Допоміжні функції завантаження/запису конфігурації |
  | `plugin-sdk/telegram-command-config` | Допоміжні функції команд Telegram | Допоміжні функції валідації команд Telegram зі стабільним резервним режимом, коли surface контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні функції prompt approval | Payload approval exec/plugin, допоміжні функції capability/profile approval, native approval routing/runtime helpers |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні функції автентифікації approval | Визначення approver, автентифікація дій у тому ж чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні функції client approval | Допоміжні функції native exec approval profile/filter |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні функції доставки approval | Адаптери native approval capability/delivery |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні функції handler approval | Спільні допоміжні функції runtime handler approval, включно із завантаженням native approval на основі capability |
  | `plugin-sdk/approval-native-runtime` | Допоміжні функції цілей approval | Допоміжні функції binding native approval target/account |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні функції reply approval | Допоміжні функції payload reply approval exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Допоміжні функції runtime-context каналу | Загальні допоміжні функції register/get/watch для channel runtime-context |
  | `plugin-sdk/security-runtime` | Допоміжні функції безпеки | Спільні допоміжні функції trust, DM gating, external-content і збирання secret |
  | `plugin-sdk/ssrf-policy` | Допоміжні функції політики SSRF | Допоміжні функції allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні функції runtime SSRF | Допоміжні функції pinned-dispatcher, guarded fetch, політики SSRF |
  | `plugin-sdk/collection-runtime` | Допоміжні функції обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні функції керування діагностикою | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні функції форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні функції графа помилок |
  | `plugin-sdk/fetch-runtime` | Допоміжні функції обгорнутого fetch/proxy | `resolveFetch`, допоміжні функції proxy |
  | `plugin-sdk/host-runtime` | Допоміжні функції нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні функції retry | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Зіставлення вхідних даних allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Керування командами та допоміжні функції surface команд | `resolveControlCommandGate`, допоміжні функції авторизації відправника, допоміжні функції реєстру команд |
  | `plugin-sdk/secret-input` | Розбір secret input | Допоміжні функції secret input |
  | `plugin-sdk/webhook-ingress` | Допоміжні функції запитів webhook | Утиліти цілей webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні функції guard тіла webhook | Допоміжні функції читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповідей | Inbound dispatch, heartbeat, planner відповідей, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні функції dispatch відповідей | Допоміжні функції finalize + dispatch provider |
  | `plugin-sdk/reply-history` | Допоміжні функції історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування reply reference | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні функції chunk відповіді | Допоміжні функції chunking тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні функції сховища session | Шлях до сховища та допоміжні функції updated-at |
  | `plugin-sdk/state-paths` | Допоміжні функції шляхів стану | Допоміжні функції директорій стану та OAuth |
  | `plugin-sdk/routing` | Допоміжні функції маршрутизації/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні функції нормалізації session-key |
  | `plugin-sdk/status-helpers` | Допоміжні функції статусу каналу | Builders зведення стану каналу/облікового запису, типові значення runtime-state, допоміжні функції метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні функції target resolver | Спільні допоміжні функції target resolver |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні функції нормалізації рядків | Допоміжні функції нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні функції URL запиту | Витягування рядкових URL з request-подібних вхідних даних |
  | `plugin-sdk/run-command` | Допоміжні функції команд із тайм-аутом | Запускач команд із нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Поширені зчитувачі параметрів tool/CLI |
  | `plugin-sdk/tool-send` | Витягування tool send | Витягування канонічних полів цілі надсилання з аргументів tool |
  | `plugin-sdk/temp-path` | Допоміжні функції тимчасових шляхів | Спільні допоміжні функції шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Допоміжні функції logging | Logger підсистеми та допоміжні функції редагування |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні функції таблиць Markdown | Допоміжні функції режиму таблиць Markdown |
  | `plugin-sdk/reply-payload` | Типи відповідей на повідомлення | Типи payload відповіді |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні функції налаштування локальних/self-hosted provider | Допоміжні функції виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/self-hosted-provider-setup` | Цільові допоміжні функції налаштування self-hosted provider, сумісних з OpenAI | Ті самі допоміжні функції виявлення/конфігурації self-hosted provider |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні функції runtime-автентифікації provider | Допоміжні функції визначення ключа API під час runtime |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні функції налаштування ключа API provider | Допоміжні функції онбордингу/запису профілю для ключів API |
  | `plugin-sdk/provider-auth-result` | Допоміжні функції результату автентифікації provider | Стандартний builder результату автентифікації OAuth |
  | `plugin-sdk/provider-auth-login` | Допоміжні функції інтерактивного входу provider | Спільні допоміжні функції інтерактивного входу |
  | `plugin-sdk/provider-env-vars` | Допоміжні функції env vars provider | Допоміжні функції пошуку env var для автентифікації provider |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні функції моделей/replay provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builders політик replay, допоміжні функції endpoint provider та нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні функції каталогу provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches онбордингу provider | Допоміжні функції конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Допоміжні функції HTTP provider | Загальні допоміжні функції HTTP/можливостей endpoint provider |
  | `plugin-sdk/provider-web-fetch` | Допоміжні функції web-fetch provider | Допоміжні функції реєстрації/кешу web-fetch provider |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні функції контракту web-search provider | Вузькі допоміжні функції контракту конфігурації/облікових даних web-search, такі як `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і setter/getter для scoped credentials |
  | `plugin-sdk/provider-web-search` | Допоміжні функції web-search provider | Допоміжні функції реєстрації/кешу/runtime web-search provider |
  | `plugin-sdk/provider-tools` | Допоміжні функції сумісності tool/schema provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також допоміжні функції сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні функції використання provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні функції використання provider |
  | `plugin-sdk/provider-stream` | Допоміжні функції обгорток потоку provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper та спільні допоміжні функції обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Упорядкована async-черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні функції медіа | Допоміжні функції fetch/transform/store медіа, а також builders media payload |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні функції генерації медіа | Спільні допоміжні функції failover, вибору candidate та повідомлень про відсутність моделі для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні функції media-understanding | Типи provider media understanding, а також exports допоміжних функцій зображення/аудіо для provider |
  | `plugin-sdk/text-runtime` | Спільні допоміжні функції тексту | Видалення тексту, видимого assistant, допоміжні функції render/chunking/table для markdown, допоміжні функції редагування, directive-tag, safe-text utilities та пов’язані допоміжні функції text/logging |
  | `plugin-sdk/text-chunking` | Допоміжні функції chunking тексту | Допоміжна функція chunking вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні функції speech | Типи provider speech, а також exports допоміжних функцій directive, registry і validation для provider |
  | `plugin-sdk/speech-core` | Спільне ядро speech | Типи provider speech, registry, directives, normalization |
  | `plugin-sdk/realtime-transcription` | Допоміжні функції realtime transcription | Типи provider та допоміжні функції registry |
  | `plugin-sdk/realtime-voice` | Допоміжні функції realtime voice | Типи provider та допоміжні функції registry |
  | `plugin-sdk/image-generation-core` | Спільне ядро image-generation | Типи image-generation, failover, auth та допоміжні функції registry |
  | `plugin-sdk/music-generation` | Допоміжні функції music-generation | Типи provider/request/result для генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро music-generation | Типи music-generation, допоміжні функції failover, пошуку provider та розбору model-ref |
  | `plugin-sdk/video-generation` | Допоміжні функції video-generation | Типи provider/request/result для генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро video-generation | Типи video-generation, допоміжні функції failover, пошуку provider та розбору model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні функції інтерактивних відповідей | Нормалізація/зведення payload інтерактивних відповідей |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви channel config-schema |
  | `plugin-sdk/channel-config-writes` | Допоміжні функції запису конфігурації каналу | Допоміжні функції авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільний prelude каналу | Exports спільного prelude channel plugin |
  | `plugin-sdk/channel-status` | Допоміжні функції статусу каналу | Спільні допоміжні функції snapshot/summary статусу каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні функції конфігурації allowlist | Допоміжні функції редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні функції доступу до group | Спільні допоміжні функції прийняття рішень щодо доступу до group |
  | `plugin-sdk/direct-dm` | Допоміжні функції direct-DM | Спільні допоміжні функції автентифікації/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні функції extension | Примітиви passive-channel/status та ambient proxy helper |
  | `plugin-sdk/webhook-targets` | Допоміжні функції цілей webhook | Реєстр цілей webhook і допоміжні функції встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні функції шляхів webhook | Допоміжні функції нормалізації шляхів webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні функції web media | Допоміжні функції завантаження віддалених/локальних медіа |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів plugin SDK |
  | `plugin-sdk/memory-core` | Допоміжні функції вбудованого memory-core | Surface допоміжних функцій memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime рушія пам’яті | Фасад runtime індексації/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Рушій foundation хоста пам’яті | Exports рушія foundation хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embeddings хоста пам’яті | Exports рушія embeddings хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста пам’яті | Exports рушія QMD хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам’яті | Exports рушія сховища хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Допоміжні функції multimodal хоста пам’яті | Допоміжні функції multimodal хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні функції запитів хоста пам’яті | Допоміжні функції запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні функції secret хоста пам’яті | Допоміжні функції secret хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Допоміжні функції журналу подій хоста пам’яті | Допоміжні функції журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні функції статусу хоста пам’яті | Допоміжні функції статусу хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста пам’яті | Допоміжні функції CLI runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Core runtime хоста пам’яті | Допоміжні функції core runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні функції файлів/runtime хоста пам’яті | Допоміжні функції файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім core runtime хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних функцій core runtime хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних функцій журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних функцій файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Допоміжні функції керованого markdown | Спільні допоміжні функції керованого markdown для plugin, суміжних із memory |
  | `plugin-sdk/memory-host-search` | Фасад пошуку active memory | Лінивий фасад runtime search-manager active memory |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних функцій статусу хоста пам’яті |
  | `plugin-sdk/memory-lancedb` | Допоміжні функції вбудованого memory-lancedb | Surface допоміжних функцій memory-lancedb |
  | `plugin-sdk/testing` | Тестові утиліти | Допоміжні функції та mocks для тестування |
</Accordion>

Ця таблиця навмисно охоплює поширену підмножину для міграції, а не всю
поверхню SDK. Повний список із понад 200 точок входу наведено в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще містить деякі шви допоміжних функцій вбудованих plugin, як-от
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й далі експортуються для
підтримки та сумісності вбудованих plugin, але навмисно
не включені до таблиці поширеної міграції й не є рекомендованою ціллю для
нового коду plugin.

Те саме правило застосовується до інших сімейств вбудованих допоміжних функцій, таких як:

- допоміжні функції підтримки browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- surfaces вбудованих helper/plugin, як-от `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі розкриває вузьку surface допоміжних функцій токенів:
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете
знайти потрібний експорт, перевірте вихідний код у `src/plugin-sdk/`
або запитайте в Discord.

## Часова шкала видалення

| Коли | Що відбувається |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз** | Застарілі поверхні видають попередження під час runtime |
| **Наступний мажорний випуск** | Застарілі поверхні буде видалено; plugins, які все ще їх використовують, перестануть працювати |

Усі core plugins уже перенесено. Зовнішнім plugin слід перейти
до наступного мажорного випуску.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний шлях, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення plugin каналів
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення plugin provider
- [Внутрішня будова plugin](/uk/plugins/architecture) — глибокий розбір архітектури
- [Маніфест plugin](/uk/plugins/manifest) — довідник зі схеми маніфесту
