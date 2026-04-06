---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви оновлюєте плагін до сучасної архітектури плагінів OpenClaw
    - Ви підтримуєте зовнішній плагін OpenClaw
sidebarTitle: Migrate to SDK
summary: Перехід із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-06T15:30:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 770eca214dcd7c7c22ee507d4bb4359b505a29c9ecd4458f7b5e1362c5cd0d6e
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Міграція Plugin SDK

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної
архітектури плагінів із точковими, задокументованими імпортами. Якщо ваш плагін
було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система плагінів надавала дві дуже широкі поверхні, які дозволяли плагінам імпортувати
все необхідне з однієї точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який повторно експортував десятки
  допоміжних функцій. Його було запроваджено, щоб старі плагіни на основі hooks продовжували працювати,
  поки будувалася нова архітектура плагінів.
- **`openclaw/extension-api`** — міст, який надавав плагінам прямий доступ до
  допоміжних засобів на боці хоста, таких як вбудований виконавець агента.

Обидві поверхні тепер **застарілі**. Вони все ще працюють під час runtime, але нові
плагіни не повинні їх використовувати, а наявні плагіни слід перенести до того, як наступний
мажорний реліз їх прибере.

<Warning>
  Шар зворотної сумісності буде вилучено в одному з майбутніх мажорних релізів.
  Плагіни, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
</Warning>

## Чому це змінилося

Старий підхід створював проблеми:

- **Повільний запуск** — імпорт однієї допоміжної функції завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Нечітка поверхня API** — не було способу зрозуміти, які експорти є стабільними, а які внутрішніми

Сучасний Plugin SDK це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Застарілі зручні seams провайдерів для вбудованих каналів також зникли. Імпорти
на кшталт `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
канальні допоміжні seams із брендовими назвами та
`openclaw/plugin-sdk/telegram-core` були приватними скороченнями mono-repo, а не
стабільними контрактами плагінів. Натомість використовуйте вузькі загальні subpath Plugin SDK. Усередині
workspace вбудованих плагінів зберігайте допоміжні засоби, що належать провайдеру, у власних
`api.ts` або `runtime-api.ts` цього плагіна.

Поточні приклади вбудованих провайдерів:

- Anthropic зберігає допоміжні засоби потоків, специфічні для Claude, у власному seam `api.ts` /
  `contract-api.ts`
- OpenAI зберігає builder-и провайдерів, допоміжні засоби типових моделей і builder-и realtime-провайдерів
  у власному `api.ts`
- OpenRouter зберігає builder провайдера та допоміжні засоби onboarding/config у власному
  `api.ts`

## Як виконати міграцію

<Steps>
  <Step title="Перевірте fallback-поведінку Windows wrapper">
    Якщо ваш плагін використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані Windows
    wrapper-и `.cmd`/`.bat` тепер аварійно завершуються із закритою помилкою, якщо ви явно не передасте
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

    Якщо ваш викликаючий код навмисно не покладається на shell fallback, не задавайте
    `allowShellFallback`, а натомість обробляйте викинуту помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Знайдіть у своєму плагіні імпорти з будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
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

    Для допоміжних засобів на боці хоста використовуйте вбудований runtime плагіна замість
    прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Той самий шаблон застосовується й до інших допоміжних засобів застарілого bridge:

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
  | `plugin-sdk/plugin-entry` | Канонічна допоміжна функція точки входу плагіна | `definePluginEntry` |
  | `plugin-sdk/core` | Застарілий umbrella-повторний експорт для визначень/builders точок входу каналів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжна функція точки входу для одного провайдера | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Точкові визначення та builder-и точок входу каналів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Запити allowlist, builder-и стану налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime для етапу налаштування | Безпечні для імпорту setup patch adapters, допоміжні засоби lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxies |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби setup adapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку/config/action-gate облікових записів |
  | `plugin-sdk/account-id` | Допоміжні засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису | Допоміжні засоби пошуку облікового запису + fallback до типового |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для облікових записів | Допоміжні засоби списку облікових записів / дій з обліковими записами |
  | `plugin-sdk/channel-setup` | Adapters майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви pairing для DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Налаштування префікса reply + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory для adapters конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder-и схем конфігурації | Типи схем конфігурації каналу |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація назв команд, обрізання опису, перевірка дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Розв’язання політик для груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Відстеження стану облікового запису | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби inbound envelope | Спільні допоміжні засоби побудови route + envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби inbound reply | Спільні допоміжні засоби record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Розбір цілей повідомлень | Допоміжні засоби розбору/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби outbound media | Спільне завантаження outbound media |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби outbound runtime | Допоміжні засоби outbound identity/send delegate |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби thread-binding | Допоміжні засоби життєвого циклу та adapters thread-binding |
  | `plugin-sdk/agent-media-payload` | Застарілі допоміжні засоби media payload | Builder payload медіа агента для застарілих layout полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише застарілі утиліти channel runtime |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів reply |
  | `plugin-sdk/runtime-store` | Постійне сховище плагіна | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/logging/backup/plugin-install |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби середовища runtime | Logger/runtime env, timeout, retry та backoff helpers |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби runtime плагінів | Допоміжні засоби commands/hooks/http/interactive для плагінів |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра hooks | Спільні допоміжні засоби конвеєра webhook/internal hook |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби process | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби CLI runtime | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби gateway | Клієнт gateway і допоміжні засоби patch status каналів |
  | `plugin-sdk/config-runtime` | Допоміжні засоби конфігурації | Допоміжні засоби завантаження/запису конфігурації |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Допоміжні засоби перевірки команд Telegram зі стабільним fallback, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби prompts погодження | Payload погодження exec/plugin, допоміжні засоби capability/profile погодження, native routing/runtime погодження |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби auth погодження | Розв’язання approver, auth дій у тому самому чаті |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта погодження | Native helpers профілю/фільтра погодження exec |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби delivery погодження | Native adapters capability/delivery погодження |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілей погодження | Native helpers binding цілей/облікових записів погодження |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби reply погодження | Helpers payload reply для погодження exec/plugin |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні helpers довіри, DM gating, external-content та збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Helpers allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби SSRF runtime | Pinned-dispatcher, guarded fetch, helpers політики SSRF |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби керування діагностикою | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, helpers графа помилок |
  | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch/proxy | `resolveFetch`, proxy helpers |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби retry | `RetryConfig`, `retryAsync`, виконувачі policy |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення входів allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Керування доступом до команд і допоміжні засоби поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, helpers реєстру команд |
  | `plugin-sdk/secret-input` | Розбір secret input | Допоміжні засоби secret input |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів webhook | Утиліти цілей webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби guard для тіла webhook-запиту | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime reply | Inbound dispatch, heartbeat, планувальник reply, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch reply | Helpers finalize + provider dispatch |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії reply | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань reply | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби chunks reply | Допоміжні засоби chunking тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій | Шлях сховища + helpers updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби state та OAuth dir |
  | `plugin-sdk/routing` | Допоміжні засоби routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers нормалізації session-key |
  | `plugin-sdk/status-helpers` | Допоміжні засоби стану каналів | Builder-и підсумку стану каналу/облікового запису, типові значення runtime-state, helpers метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби розв’язання цілей | Спільні helpers розв’язання цілей |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Helpers нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запиту | Витягання рядкових URL із вхідних даних, подібних до запиту |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із таймерами | Виконавець команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Зчитувачі параметрів | Поширені зчитувачі параметрів tool/CLI |
  | `plugin-sdk/tool-send` | Витягнення надсилання tool | Витягання канонічних полів цілі надсилання з аргументів tool |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні helpers шляхів для тимчасового завантаження |
  | `plugin-sdk/logging-core` | Допоміжні засоби логування | Logger підсистеми та helpers редагування чутливих даних |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби таблиць Markdown | Допоміжні засоби режиму таблиць Markdown |
  | `plugin-sdk/reply-payload` | Типи reply повідомлень | Типи payload reply |
  | `plugin-sdk/provider-setup` | Відібрані допоміжні засоби налаштування локальних/self-hosted провайдерів | Допоміжні засоби виявлення/конфігурації self-hosted провайдерів |
  | `plugin-sdk/self-hosted-provider-setup` | Точкові допоміжні засоби налаштування self-hosted провайдерів, сумісних з OpenAI | Ті самі допоміжні засоби виявлення/конфігурації self-hosted провайдерів |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби runtime-автентифікації провайдера | Допоміжні засоби runtime для розв’язання API key |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API key провайдера | Допоміжні засоби onboarding/profile-write для API key |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби результатів автентифікації провайдера | Стандартний builder результату OAuth-автентифікації |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного входу провайдера | Спільні допоміжні засоби інтерактивного входу |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env vars провайдера | Допоміжні засоби пошуку env vars автентифікації провайдера |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделей/replay провайдера | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні builder-и policy replay, helpers endpoint провайдера та helpers нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу провайдера | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch-и onboarding провайдера | Допоміжні засоби конфігурації onboarding |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP провайдера | Загальні helpers можливостей HTTP/endpoint провайдера |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch провайдера | Helpers реєстрації/кешу провайдера web-fetch |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search провайдера | Helpers реєстрації/кешу/конфігурації провайдера web-search |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності tools/schema провайдера | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також helpers сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби usage провайдера | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші helpers usage провайдера |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгортки потоків провайдера | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні helpers обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби media | Допоміжні засоби отримання/перетворення/зберігання media плюс builder-и media payload |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації media | Спільні helpers failover, вибір кандидатів і повідомлення про відсутню модель для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби media understanding | Типи провайдера media understanding плюс provider-facing експорти helpers зображення/аудіо |
  | `plugin-sdk/text-runtime` | Спільні допоміжні засоби тексту | Видалення тексту, видимого асистенту, helpers рендерингу/chunking/table для markdown, helpers редагування, helpers тегів директив, утиліти безпечного тексту та пов’язані helpers тексту/логування |
  | `plugin-sdk/text-chunking` | Допоміжні засоби chunking тексту | Допоміжна функція chunking вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні засоби speech | Типи провайдерів speech плюс provider-facing helpers директив, реєстру й валідації |
  | `plugin-sdk/speech-core` | Спільне ядро speech | Типи провайдерів speech, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби realtime transcription | Типи провайдера та helpers реєстру |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби realtime voice | Типи провайдера та helpers реєстру |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Helpers типів, failover, auth і реєстру для генерації зображень |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи провайдера/запиту/результату для генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, helpers failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи провайдера/запиту/результату для генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, helpers failover, пошук провайдера та розбір model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивних reply | Нормалізація/зменшення payload інтерактивних reply |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації каналу | Вузькі примітиви channel config-schema |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації каналу | Допоміжні засоби авторизації запису конфігурації каналу |
  | `plugin-sdk/channel-plugin-common` | Спільний prelude каналу | Експорти спільного prelude плагіна каналу |
  | `plugin-sdk/channel-status` | Допоміжні засоби стану каналу | Спільні helpers snapshot/summary стану каналу |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації allowlist | Допоміжні засоби редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби доступу до груп | Спільні helpers прийняття рішень щодо групового доступу |
  | `plugin-sdk/direct-dm` | Допоміжні засоби direct-DM | Спільні helpers auth/guard для direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби extension | Примітиви passive-channel/status та ambient proxy helper |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей webhook | Реєстр цілей webhook і helpers встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляхів webhook | Допоміжні засоби нормалізації шляхів webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби web media | Допоміжні засоби завантаження віддалених/локальних media |
  | `plugin-sdk/zod` | Повторний експорт zod | Повторно експортований `zod` для споживачів Plugin SDK |
  | `plugin-sdk/memory-core` | Вбудовані допоміжні засоби memory-core | Поверхня допоміжних засобів memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime facade рушія пам’яті | Runtime facade індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій хоста пам’яті | Експорти foundation engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embedding хоста пам’яті | Експорти embedding engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-qmd` | QMD-рушій хоста пам’яті | Експорти QMD engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій зберігання хоста пам’яті | Експорти storage engine хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті | Мультимодальні допоміжні засоби хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті | Допоміжні засоби запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті | Допоміжні засоби секретів хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті | Допоміжні засоби журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби стану хоста пам’яті | Допоміжні засоби стану хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста пам’яті | Допоміжні засоби CLI runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Базовий runtime хоста пам’яті | Допоміжні засоби core runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті | Допоміжні засоби файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім core runtime хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів core runtime хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого markdown | Спільні helpers керованого markdown для плагінів, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Facade активного пошуку в пам’яті | Lazy facade runtime менеджера активного пошуку в пам’яті |
  | `plugin-sdk/memory-host-status` | Псевдонім стану хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів стану хоста пам’яті |
  | `plugin-sdk/memory-lancedb` | Вбудовані допоміжні засоби memory-lancedb | Поверхня допоміжних засобів memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Допоміжні засоби тестів і mocks |
</Accordion>

Ця таблиця навмисно містить поширену підмножину для міграції, а не повну
поверхню SDK. Повний список із понад 200 entrypoints міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще включає деякі допоміжні seams вбудованих плагінів, такі як
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
підтримки вбудованих плагінів і сумісності, але навмисно
опущені з таблиці поширеної міграції й не є рекомендованою ціллю для
нового коду плагінів.

Те саме правило застосовується до інших сімейств вбудованих helper-ів, таких як:

- helpers підтримки browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
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
поверхню token-helper `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає вашому завданню. Якщо ви не можете знайти експорт,
перевірте вихідний код у `src/plugin-sdk/` або запитайте в Discord.

## Графік вилучення

| Коли | Що відбувається |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз** | Застарілі поверхні видають попередження під час runtime |
| **У наступному мажорному релізі** | Застарілі поверхні буде вилучено; плагіни, які все ще їх використовують, перестануть працювати |

Усі core-плагіни вже мігровано. Зовнішнім плагінам слід виконати міграцію
до наступного мажорного релізу.

## Тимчасове приглушення попереджень

Задайте ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий запасний вихід, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створення вашого першого плагіна
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів subpath
- [Плагіни каналів](/uk/plugins/sdk-channel-plugins) — створення плагінів каналів
- [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) — створення плагінів провайдерів
- [Внутрішня будова плагінів](/uk/plugins/architecture) — детальний розбір архітектури
- [Маніфест плагіна](/uk/plugins/manifest) — довідник схеми маніфесту
