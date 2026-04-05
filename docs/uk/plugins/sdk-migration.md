---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви оновлюєте plugin до сучасної архітектури plugin
    - Ви підтримуєте зовнішній plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-05T22:37:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23fd97ccf58e626ea4be4ae36d060cb963e13f14036cd82d2a86b7dc631ec8f1
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Міграція Plugin SDK

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної
архітектури plugin із цільовими, задокументованими імпортами. Якщо ваш plugin
було створено до появи нової архітектури, цей посібник допоможе вам
перейти на неї.

## Що змінюється

Стара система plugin надавала дві широко відкриті поверхні, які дозволяли plugin
імпортувати все, що їм потрібно, з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — один імпорт, який повторно експортував десятки
  допоміжних засобів. Його було введено, щоб старі plugin на основі hook
  продовжували працювати, поки створювалася нова архітектура plugin.
- **`openclaw/extension-api`** — міст, який надавав plugin прямий доступ до
  допоміжних засобів на стороні хоста, як-от вбудований засіб запуску agent.

Обидві поверхні тепер **застарілі**. Вони все ще працюють під час виконання, але нові
plugin не повинні їх використовувати, а наявним plugin слід перейти на нові
механізми до того, як наступний мажорний реліз їх видалить.

<Warning>
  Шар зворотної сумісності буде видалено в одному з майбутніх мажорних релізів.
  Plugin, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
</Warning>

## Чому це змінилося

Старий підхід створював проблеми:

- **Повільний запуск** — імпорт одного допоміжного засобу завантажував десятки не пов’язаних між собою модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Нечітка поверхня API** — не було способу зрозуміти, які експорти є стабільними, а які внутрішніми

Сучасний Plugin SDK вирішує це: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим, самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі зручні шви provider для вбудованих каналів також зникли. Імпорти
на кшталт `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
канально-брендовані допоміжні шви та
`openclaw/plugin-sdk/telegram-core` були приватними скороченнями монорепозиторію, а не
стабільними контрактами plugin. Натомість використовуйте вузькі загальні підшляхи SDK. Усередині
робочого простору вбудованих plugin зберігайте допоміжні засоби, що належать provider, у власних
`api.ts` або `runtime-api.ts` цього plugin.

Поточні приклади вбудованих provider:

- Anthropic зберігає допоміжні засоби потоків, специфічні для Claude, у власному шві `api.ts` /
  `contract-api.ts`
- OpenAI зберігає білдери provider, допоміжні засоби моделей за замовчуванням і білдери realtime provider
  у власному `api.ts`
- OpenRouter зберігає білдер provider та допоміжні засоби onboarding/config у власному
  `api.ts`

## Як виконати міграцію

<Steps>
  <Step title="Перевірте резервну поведінку оболонки-обгортки Windows">
    Якщо ваш plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані Windows-
    обгортки `.cmd`/`.bat` тепер завершуються у закритому режимі, якщо ви явно не передасте
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

    Якщо ваш викликаючий код не покладається навмисно на резервний перехід через оболонку, не встановлюйте
    `allowShellFallback` і натомість обробляйте викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у своєму plugin імпорти з будь-якої з двох застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть їх цільовими імпортами">
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

    Для допоміжних засобів на стороні хоста використовуйте інжектований runtime plugin замість
    прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Такий самий шаблон застосовується й до інших застарілих допоміжних засобів bridge:

    | Старий імпорт | Сучасний еквівалент |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | допоміжні засоби сховища session | `api.runtime.agent.session.*` |

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
  | `plugin-sdk/plugin-entry` | Канонічний допоміжний засіб точки входу plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий зонтичний повторний експорт для визначень/білдерів точок входу каналів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми config | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб точки входу для одного provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Цільові визначення та білдери точок входу каналів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Підказки allowlist, білдери стану налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime під час налаштування | Безпечні для імпорту адаптери patch налаштування, допоміжні засоби приміток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для багатьох облікових записів | Допоміжні засоби списку облікових записів/config/шлюзу дій |
  | `plugin-sdk/account-id` | Допоміжні засоби ідентифікатора облікового запису | `DEFAULT_ACCOUNT_ID`, нормалізація ідентифікатора облікового запису |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису | Допоміжні засоби пошуку облікового запису + резервного вибору за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби облікового запису | Допоміжні засоби списку облікових записів/дій з обліковим записом |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви pair для DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді + логіка індикації набору | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів config | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Білдери схем config | Типи схем config каналу |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби config команд Telegram | Нормалізація назв команд, обрізання описів, валідація дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Відстеження стану облікового запису | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби вхідного envelope | Спільні допоміжні засоби маршрутів + білдера envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби вхідних відповідей | Спільні допоміжні засоби запису та диспетчеризації |
  | `plugin-sdk/messaging-targets` | Аналіз цілей повідомлень | Допоміжні засоби аналізу/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби вихідного media | Спільне завантаження вихідного media |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідного runtime | Допоміжні засоби ідентичності вихідних повідомлень/делегування надсилання |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби прив’язки thread | Життєвий цикл прив’язки thread та допоміжні засоби адаптера |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби media payload | Білдер media payload agent для застарілих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти runtime каналу |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/logging/backup/інсталяції plugin |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби середовища runtime | Logger/runtime env, допоміжні засоби timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби runtime plugin | Допоміжні засоби plugin для command/hooks/http/interactive |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра hook | Спільні допоміжні засоби конвеєра webhook/внутрішнього hook |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби CLI runtime | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби gateway | Клієнт gateway і допоміжні засоби patch стану каналу |
  | `plugin-sdk/config-runtime` | Допоміжні засоби config | Допоміжні засоби завантаження/запису config |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Допоміжні засоби валідації команд Telegram зі стабільним резервним режимом, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби запиту approval | Допоміжні засоби payload approval exec/plugin, можливостей/профілів approval, нативної маршрутизації/runtime approval |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби auth для approval | Визначення approver, auth дій у тому самому chat |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта approval | Допоміжні засоби профілів/фільтрів нативного approval exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки approval | Адаптери можливостей/доставки нативного approval |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілей approval | Допоміжні засоби прив’язки цілей/облікових записів нативного approval |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповідей approval | Допоміжні засоби payload відповідей approval exec/plugin |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби trust, шлюзування DM, зовнішнього контенту та збирання secret |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби SSRF runtime | Допоміжні засоби pinned-dispatcher, guarded fetch, SSRF policy |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого cache | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичного шлюзування | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch/proxy | `resolveFetch`, допоміжні засоби proxy |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби retry | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Зіставлення вхідних даних allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Шлюзування command і допоміжні засоби поверхні command | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру command |
  | `plugin-sdk/secret-input` | Аналіз введення secret | Допоміжні засоби введення secret |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів webhook | Утиліти цілей webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби guard для тіла webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповідей | Вхідна диспетчеризація, heartbeat, планувальник відповідей, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації відповідей | Допоміжні засоби завершення + диспетчеризації provider |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби chunk відповіді | Допоміжні засоби chunking тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища session | Допоміжні засоби шляхів сховища + updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів state | Допоміжні засоби каталогів state та OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби routing/ключів session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації ключів session |
  | `plugin-sdk/status-helpers` | Допоміжні засоби стану каналу | Білдери підсумків стану каналу/облікового запису, значення runtime-state за замовчуванням, допоміжні засоби метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби визначення цілі | Спільні допоміжні засоби визначення цілі |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Отримання рядкових URL з вхідних даних, подібних до request |
  | `plugin-sdk/run-command` | Допоміжні засоби timed command | Виконавець timed command із нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі param | Загальні зчитувачі param для tool/CLI |
  | `plugin-sdk/tool-send` | Витягування надсилання tool | Витягування канонічних полів цілі надсилання з аргументів tool |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Допоміжні засоби logging | Logger підсистеми та допоміжні засоби редагування |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби таблиць Markdown | Допоміжні засоби режимів таблиць Markdown |
  | `plugin-sdk/reply-payload` | Типи payload відповіді | Типи payload відповіді |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локального/self-hosted provider | Допоміжні засоби виявлення/config self-hosted provider |
  | `plugin-sdk/self-hosted-provider-setup` | Цільові допоміжні засоби налаштування self-hosted provider, сумісного з OpenAI | Ті самі допоміжні засоби виявлення/config self-hosted provider |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби auth runtime provider | Допоміжні засоби визначення API-ключа під час runtime |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключа provider | Допоміжні засоби onboarding/запису профілю для API-ключа |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби результатів auth provider | Стандартний білдер результату auth OAuth |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного входу provider | Спільні допоміжні засоби інтерактивного входу |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env var provider | Допоміжні засоби пошуку env var auth provider |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделей/replay provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні білдери політик replay, допоміжні засоби endpoint provider та допоміжні засоби нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch onboarding provider | Допоміжні засоби config onboarding |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP provider | Загальні допоміжні засоби можливостей HTTP/endpoint provider |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch provider | Допоміжні засоби реєстрації/cache provider web-fetch |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search provider | Допоміжні засоби реєстрації/cache/config provider web-search |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності tool/schema provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби використання provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби використання provider |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгортки потоків provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Впорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби media | Допоміжні засоби отримання/перетворення/зберігання media та білдери media payload |
  | `plugin-sdk/media-understanding` | Допоміжні засоби media-understanding | Типи provider media understanding та експорти допоміжних засобів зображень/аудіо для provider |
  | `plugin-sdk/text-runtime` | Спільні допоміжні засоби тексту | Видалення видимого для assistant тексту, допоміжні засоби render/chunking/table для markdown, редагування, допоміжні засоби тегів директив, утиліти безпечного тексту та пов’язані допоміжні засоби text/logging |
  | `plugin-sdk/text-chunking` | Допоміжні засоби chunking тексту | Допоміжний засіб chunking вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні засоби speech | Типи provider speech та експорти допоміжних засобів директив, реєстру й валідації для provider |
  | `plugin-sdk/speech-core` | Спільне ядро speech | Типи provider speech, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби realtime transcription | Типи provider та допоміжні засоби реєстру |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби realtime voice | Типи provider та допоміжні засоби реєстру |
  | `plugin-sdk/image-generation-core` | Спільне ядро image-generation | Типи image-generation, failover, auth та допоміжні засоби реєстру |
  | `plugin-sdk/video-generation` | Допоміжні засоби video-generation | Типи provider/request/result для video-generation |
  | `plugin-sdk/video-generation-core` | Спільне ядро video-generation | Типи video-generation, допоміжні засоби failover, пошук provider і аналіз model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивних відповідей | Нормалізація/скорочення payload інтерактивних відповідей |
  | `plugin-sdk/channel-config-primitives` | Примітиви config каналу | Вузькі примітиви schema config каналу |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису config каналу | Допоміжні засоби авторизації запису config каналу |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула каналу | Експорти спільної преамбули plugin каналу |
  | `plugin-sdk/channel-status` | Допоміжні засоби стану каналу | Спільні допоміжні засоби snapshot/summary стану каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби config allowlist | Допоміжні засоби редагування/читання config allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби доступу груп | Спільні допоміжні засоби рішень щодо доступу груп |
  | `plugin-sdk/direct-dm` | Допоміжні засоби direct-DM | Спільні допоміжні засоби auth/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби extension | Примітиви допоміжних засобів passive-channel/status |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей webhook | Реєстр цілей webhook і допоміжні засоби встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляхів webhook | Допоміжні засоби нормалізації шляхів webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби web media | Допоміжні засоби завантаження віддаленого/локального media |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів Plugin SDK |
  | `plugin-sdk/memory-core` | Допоміжні засоби вбудованого memory-core | Поверхня допоміжних засобів memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime рушія пам’яті | Фасад runtime індексації/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій host пам’яті | Експорти базового рушія host пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embedding host пам’яті | Експорти рушія embedding host пам’яті |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD host пам’яті | Експорти рушія QMD host пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища host пам’яті | Експорти рушія сховища host пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби host пам’яті | Мультимодальні допоміжні засоби host пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів host пам’яті | Допоміжні засоби запитів host пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret host пам’яті | Допоміжні засоби secret host пам’яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби стану host пам’яті | Допоміжні засоби стану host пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime host пам’яті | Допоміжні засоби CLI runtime host пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Основний runtime host пам’яті | Основні допоміжні засоби runtime host пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime host пам’яті | Допоміжні засоби файлів/runtime host пам’яті |
  | `plugin-sdk/memory-lancedb` | Допоміжні засоби вбудованого memory-lancedb | Поверхня допоміжних засобів memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Допоміжні засоби тестування та mocks |
</Accordion>

Ця таблиця навмисно охоплює поширену підмножину для міграції, а не всю
поверхню SDK. Повний список із понад 200 точок входу міститься у
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще містить деякі допоміжні шви вбудованих plugin, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й далі експортуються для
підтримки та сумісності вбудованих plugin, але навмисно
не включені до таблиці поширеної міграції й не є рекомендованою ціллю для
нового коду plugin.

Те саме правило застосовується до інших сімейств вбудованих допоміжних засобів, таких як:

- допоміжні засоби підтримки browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні вбудованих helper/plugin, такі як `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку
поверхню допоміжних засобів token: `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає вашому завданню. Якщо ви не можете знайти експорт,
перевірте вихідний код у `src/plugin-sdk/` або запитайте в Discord.

## Хронологія видалення

| Коли | Що відбувається |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**                | Застарілі поверхні виводять попередження під час runtime                               |
| **Наступний мажорний реліз** | Застарілі поверхні буде видалено; plugin, які все ще їх використовують, перестануть працювати |

Усі core plugin уже мігровано. Зовнішнім plugin слід перейти на нові механізми
до наступного мажорного релізу.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки ви працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний шлях, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів за підшляхами
- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — створення plugin каналів
- [Плагіни provider](/uk/plugins/sdk-provider-plugins) — створення plugin provider
- [Внутрішня будова plugin](/uk/plugins/architecture) — глибоке занурення в архітектуру
- [Маніфест plugin](/uk/plugins/manifest) — довідник зі схеми маніфесту
