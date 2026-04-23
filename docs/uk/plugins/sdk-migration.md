---
read_when:
    - Ви бачите попередження OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Ви бачите попередження OPENCLAW_EXTENSION_API_DEPRECATED
    - Ви оновлюєте Plugin до сучасної архітектури plugin-ів
    - Ви підтримуєте зовнішній Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Перейдіть із застарілого шару зворотної сумісності на сучасний Plugin SDK
title: Міграція Plugin SDK
x-i18n:
    generated_at: "2026-04-23T02:58:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0abdf5135b0e0a029348b77447ca713e43762a65934310088a098fee93cf9981
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Міграція Plugin SDK

OpenClaw перейшов від широкого шару зворотної сумісності до сучасної архітектури plugin-ів зі сфокусованими, задокументованими імпортами. Якщо ваш Plugin було створено до появи нової архітектури, цей посібник допоможе вам виконати міграцію.

## Що змінюється

Стара система plugin-ів надавала дві широкі поверхні, які дозволяли plugin-ам імпортувати
все, що їм потрібно, з єдиної точки входу:

- **`openclaw/plugin-sdk/compat`** — єдиний імпорт, який повторно експортував десятки
  допоміжних засобів. Його було запроваджено, щоб зберегти працездатність старіших plugin-ів на основі хуків, поки будувалася нова архітектура plugin-ів.
- **`openclaw/extension-api`** — міст, який надавав plugin-ам прямий доступ до
  допоміжних засобів на боці хоста, таких як вбудований виконавець агентів.

Обидві поверхні тепер **застарілі**. Вони все ще працюють під час виконання, але нові
plugin-и не повинні їх використовувати, а наявні plugin-и мають виконати міграцію до того, як у наступному мажорному релізі їх буде вилучено.

<Warning>
  Шар зворотної сумісності буде вилучено в одному з майбутніх мажорних релізів.
  Plugin-и, які все ще імпортують із цих поверхонь, перестануть працювати, коли це станеться.
</Warning>

## Чому це змінилося

Старий підхід спричиняв проблеми:

- **Повільний запуск** — імпорт одного допоміжного засобу завантажував десятки не пов’язаних модулів
- **Циклічні залежності** — широкі повторні експорти спрощували створення циклів імпорту
- **Нечітка поверхня API** — не було способу визначити, які експорти є стабільними, а які внутрішніми

Сучасний Plugin SDK це виправляє: кожен шлях імпорту (`openclaw/plugin-sdk/\<subpath\>`)
є невеликим, самодостатнім модулем із чітким призначенням і задокументованим контрактом.

Успадковані зручні поверхні provider-ів для вбудованих channel-ів також більше не існують. Імпорти
на кшталт `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
допоміжні поверхні з брендуванням channel-ів і
`openclaw/plugin-sdk/telegram-core` були приватними скороченнями монорепозиторію, а не
стабільними контрактами plugin-ів. Натомість використовуйте вузькі узагальнені підшляхи SDK. Усередині
робочого простору вбудованого Plugin зберігайте допоміжні засоби, що належать provider-у, у власному
`api.ts` або `runtime-api.ts` цього plugin-а.

Поточні приклади вбудованих provider-ів:

- Anthropic зберігає специфічні для Claude допоміжні засоби потоків у власній поверхні `api.ts` /
  `contract-api.ts`
- OpenAI зберігає білдери provider-ів, допоміжні засоби моделей за замовчуванням і білдери
  provider-ів realtime у власному `api.ts`
- OpenRouter зберігає білдер provider-а та допоміжні засоби онбордингу/конфігурації у власному
  `api.ts`

## Як виконати міграцію

<Steps>
  <Step title="Перенесіть approval-native обробники на факти можливостей">
    Channel plugin-и з підтримкою approval тепер розкривають нативну поведінку approval через
    `approvalCapability.nativeRuntime` разом зі спільним реєстром runtime-контексту.

    Ключові зміни:

    - Замініть `approvalCapability.handler.loadRuntime(...)` на
      `approvalCapability.nativeRuntime`
    - Перенесіть auth/доставку, специфічні для approval, із застарілої прив’язки `plugin.auth` /
      `plugin.approvals` на `approvalCapability`
    - `ChannelPlugin.approvals` було вилучено з публічного контракту channel-plugin-а;
      перенесіть поля delivery/native/render до `approvalCapability`
    - `plugin.auth` залишається лише для потоків login/logout channel-ів; auth-хуки
      approval там більше не зчитуються core
    - Реєструйте об’єкти runtime, що належать channel-у, як-от клієнти, токени або Bolt
      apps, через `openclaw/plugin-sdk/channel-runtime-context`
    - Не надсилайте сповіщення reroute, що належать plugin-у, з нативних обробників approval;
      сповіщення «маршрутизовано в інше місце» тепер належать core і базуються на фактичних результатах доставки
    - Під час передавання `channelRuntime` у `createChannelManager(...)` надавайте
      реальну поверхню `createPluginRuntime().channel`. Часткові заглушки відхиляються.

    Поточну структуру можливостей approval див. у `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Перевірте резервну поведінку Windows wrapper">
    Якщо ваш Plugin використовує `openclaw/plugin-sdk/windows-spawn`, нерозв’язані Windows
    wrapper-и `.cmd`/`.bat` тепер аварійно завершуються за принципом fail closed, якщо ви явно не передасте `allowShellFallback: true`.

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

    Якщо ваш виклик навмисно не покладається на shell fallback, не задавайте
    `allowShellFallback`, а натомість обробляйте згенеровану помилку.

  </Step>

  <Step title="Знайдіть застарілі імпорти">
    Пошукайте у своєму Plugin імпорти з будь-якої із застарілих поверхонь:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Замініть на сфокусовані імпорти">
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

    Для допоміжних засобів на боці хоста використовуйте впроваджений runtime Plugin замість прямого імпорту:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Такий самий шаблон застосовується й до інших допоміжних засобів застарілого моста:

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
  | `plugin-sdk/core` | Успадкований узагальнений повторний експорт для визначень/білдерів точок входу channel-ів | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Експорт кореневої схеми конфігурації | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Допоміжний засіб точки входу для одного provider-а | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Сфокусовані визначення та білдери точок входу channel-ів | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування | Запити allowlist, білдери статусу налаштування |
  | `plugin-sdk/setup-runtime` | Допоміжні засоби runtime під час налаштування | Безпечні для імпорту адаптери патчів налаштування, допоміжні засоби приміток пошуку, `promptResolvedAllowFrom`, `splitSetupEntries`, делеговані проксі налаштування |
  | `plugin-sdk/setup-adapter-runtime` | Допоміжні засоби адаптера налаштування | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Допоміжні засоби інструментів налаштування | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Допоміжні засоби для кількох облікових записів | Допоміжні засоби списку/конфігурації/шлюзу дій облікового запису |
  | `plugin-sdk/account-id` | Допоміжні засоби account-id | `DEFAULT_ACCOUNT_ID`, нормалізація account-id |
  | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікових записів | Допоміжні засоби пошуку облікових записів + резервного вибору значення за замовчуванням |
  | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби облікових записів | Допоміжні засоби списку облікових записів/дій облікового запису |
  | `plugin-sdk/channel-setup` | Адаптери майстра налаштування | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Примітиви сполучення DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Префікс відповіді + зв’язування typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Фабрики адаптерів конфігурації | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Білдери схем конфігурації | Типи схем конфігурації channel-ів |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби конфігурації команд Telegram | Нормалізація назв команд, обрізання описів, валідація дублікатів/конфліктів |
  | `plugin-sdk/channel-policy` | Визначення політики груп/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Допоміжні засоби життєвого циклу статусу облікового запису та потоку чернеток | `createAccountStatusSink`, допоміжні засоби фіналізації попереднього перегляду чернетки |
  | `plugin-sdk/inbound-envelope` | Допоміжні засоби вхідного envelope | Спільні допоміжні засоби маршрутизації + побудови envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Допоміжні засоби вхідних відповідей | Спільні допоміжні засоби запису та диспетчеризації |
  | `plugin-sdk/messaging-targets` | Аналіз цілей повідомлень | Допоміжні засоби аналізу/зіставлення цілей |
  | `plugin-sdk/outbound-media` | Допоміжні засоби вихідного медіа | Спільне завантаження вихідного медіа |
  | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідного runtime | Допоміжні засоби вихідної ідентичності/делегата надсилання та планування payload |
  | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби прив’язок thread | Допоміжні засоби життєвого циклу прив’язок thread і адаптера |
  | `plugin-sdk/agent-media-payload` | Успадковані допоміжні засоби media payload | Білдер media payload агента для успадкованих макетів полів |
  | `plugin-sdk/channel-runtime` | Застарілий shim сумісності | Лише успадковані утиліти runtime channel-ів |
  | `plugin-sdk/channel-send-result` | Типи результатів надсилання | Типи результатів відповіді |
  | `plugin-sdk/runtime-store` | Постійне сховище Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime | Допоміжні засоби runtime/логування/резервного копіювання/встановлення plugin-ів |
  | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime env | Logger/runtime env, допоміжні засоби timeout, retry і backoff |
  | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби runtime Plugin | Допоміжні засоби команд/хуків/http/інтерактивності Plugin |
  | `plugin-sdk/hook-runtime` | Допоміжні засоби конвеєра hook | Спільні допоміжні засоби конвеєра Webhook/внутрішніх hook |
  | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Допоміжні засоби процесів | Спільні допоміжні засоби exec |
  | `plugin-sdk/cli-runtime` | Допоміжні засоби CLI runtime | Форматування команд, очікування, допоміжні засоби версій |
  | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway | Клієнт Gateway і допоміжні засоби patch статусу channel-ів |
  | `plugin-sdk/config-runtime` | Допоміжні засоби конфігурації | Допоміжні засоби завантаження/запису конфігурації |
  | `plugin-sdk/telegram-command-config` | Допоміжні засоби команд Telegram | Допоміжні засоби валідації команд Telegram зі стабільним fallback, коли поверхня контракту вбудованого Telegram недоступна |
  | `plugin-sdk/approval-runtime` | Допоміжні засоби запитів approval | Payload approval exec/plugin, допоміжні засоби можливостей/профілю approval, нативні допоміжні засоби маршрутизації/runtime approval |
  | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби auth approval | Визначення approver, auth дій у тому самому chat |
  | `plugin-sdk/approval-client-runtime` | Допоміжні засоби клієнта approval | Допоміжні засоби профілю/фільтра нативного exec approval |
  | `plugin-sdk/approval-delivery-runtime` | Допоміжні засоби доставки approval | Нативні адаптери можливостей/доставки approval |
  | `plugin-sdk/approval-gateway-runtime` | Допоміжні засоби Gateway approval | Спільний допоміжний засіб визначення Gateway approval |
  | `plugin-sdk/approval-handler-adapter-runtime` | Допоміжні засоби адаптера approval | Полегшені допоміжні засоби завантаження адаптера нативного approval для гарячих точок входу channel-ів |
  | `plugin-sdk/approval-handler-runtime` | Допоміжні засоби обробника approval | Ширші допоміжні засоби runtime обробника approval; віддавайте перевагу вужчим поверхням adapter/gateway, коли їх достатньо |
  | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілі approval | Допоміжні засоби нативної цілі approval/прив’язки облікового запису |
  | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби відповіді approval | Допоміжні засоби payload відповіді exec/plugin approval |
  | `plugin-sdk/channel-runtime-context` | Допоміжні засоби runtime-context channel-ів | Узагальнені допоміжні засоби register/get/watch для runtime-context channel-ів |
  | `plugin-sdk/security-runtime` | Допоміжні засоби безпеки | Спільні допоміжні засоби довіри, шлюзу DM, зовнішнього вмісту та збирання секретів |
  | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF | Допоміжні засоби allowlist хостів і політики приватної мережі |
  | `plugin-sdk/ssrf-runtime` | Допоміжні засоби SSRF runtime | Допоміжні засоби pinned-dispatcher, guarded fetch, SSRF policy |
  | `plugin-sdk/collection-runtime` | Допоміжні засоби обмеженого кешу | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби шлюзу діагностики | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Допоміжні засоби форматування помилок | `formatUncaughtError`, `isApprovalNotFoundError`, допоміжні засоби графа помилок |
  | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch/proxy | `resolveFetch`, допоміжні засоби proxy |
  | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації хоста | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Допоміжні засоби retry | `RetryConfig`, `retryAsync`, виконавці політик |
  | `plugin-sdk/allow-from` | Форматування allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Відображення вхідних даних allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Шлюз команд і допоміжні засоби поверхні команд | `resolveControlCommandGate`, допоміжні засоби авторизації відправника, допоміжні засоби реєстру команд |
  | `plugin-sdk/command-status` | Рендерери статусу/довідки команд | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Аналіз секретного введення | Допоміжні засоби секретного введення |
  | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів Webhook | Утиліти цілі Webhook |
  | `plugin-sdk/webhook-request-guards` | Допоміжні засоби guard для тіла запиту Webhook | Допоміжні засоби читання/обмеження тіла запиту |
  | `plugin-sdk/reply-runtime` | Спільний runtime відповіді | Вхідна диспетчеризація, Heartbeat, планувальник відповіді, чанкування |
  | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації відповідей | Допоміжні засоби finalize + диспетчеризації provider-а |
  | `plugin-sdk/reply-history` | Допоміжні засоби історії відповідей | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Планування посилань відповіді | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Допоміжні засоби чанків відповіді | Допоміжні засоби чанкування тексту/markdown |
  | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій | Допоміжні засоби шляху сховища + updated-at |
  | `plugin-sdk/state-paths` | Допоміжні засоби шляхів стану | Допоміжні засоби каталогів стану та OAuth |
  | `plugin-sdk/routing` | Допоміжні засоби маршрутизації/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, допоміжні засоби нормалізації session-key |
  | `plugin-sdk/status-helpers` | Допоміжні засоби статусу channel-ів | Білдери підсумків статусу channel-ів/облікових записів, значення runtime-state за замовчуванням, допоміжні засоби метаданих проблем |
  | `plugin-sdk/target-resolver-runtime` | Допоміжні засоби визначення цілей | Спільні допоміжні засоби визначення цілей |
  | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації рядків | Допоміжні засоби нормалізації slug/рядків |
  | `plugin-sdk/request-url` | Допоміжні засоби URL запитів | Витягування рядкових URL з подібних до request вхідних даних |
  | `plugin-sdk/run-command` | Допоміжні засоби команд із таймерами | Виконавець команд із таймером і нормалізованими stdout/stderr |
  | `plugin-sdk/param-readers` | Читачі параметрів | Поширені читачі параметрів tool/CLI |
  | `plugin-sdk/tool-payload` | Витягування payload tool | Витягування нормалізованих payload з об’єктів результатів tool |
  | `plugin-sdk/tool-send` | Витягування send tool | Витягування канонічних полів цілі send з аргументів tool |
  | `plugin-sdk/temp-path` | Допоміжні засоби тимчасових шляхів | Спільні допоміжні засоби шляхів тимчасового завантаження |
  | `plugin-sdk/logging-core` | Допоміжні засоби логування | Допоміжні засоби logger підсистеми та редагування |
  | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби markdown-table | Допоміжні засоби режиму markdown-table |
  | `plugin-sdk/reply-payload` | Типи reply повідомлень | Типи payload відповіді |
  | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локальних/self-hosted provider-ів | Допоміжні засоби виявлення/конфігурації self-hosted provider-ів |
  | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування self-hosted provider-ів, сумісних з OpenAI | Ті самі допоміжні засоби виявлення/конфігурації self-hosted provider-ів |
  | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби runtime auth provider-а | Допоміжні засоби визначення API-ключа runtime |
  | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби налаштування API-ключа provider-а | Допоміжні засоби онбордингу/запису профілю API-ключа |
  | `plugin-sdk/provider-auth-result` | Допоміжні засоби auth-result provider-а | Стандартний білдер OAuth auth-result |
  | `plugin-sdk/provider-auth-login` | Допоміжні засоби інтерактивного login provider-а | Спільні допоміжні засоби інтерактивного login |
  | `plugin-sdk/provider-env-vars` | Допоміжні засоби env-var provider-а | Допоміжні засоби пошуку env-var auth provider-а |
  | `plugin-sdk/provider-model-shared` | Спільні допоміжні засоби моделей/replay provider-а | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні білдери політики replay, допоміжні засоби endpoint provider-а та нормалізації model-id |
  | `plugin-sdk/provider-catalog-shared` | Спільні допоміжні засоби каталогу provider-ів | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Патчі онбордингу provider-а | Допоміжні засоби конфігурації онбордингу |
  | `plugin-sdk/provider-http` | Допоміжні засоби HTTP provider-а | Узагальнені допоміжні засоби HTTP/можливостей endpoint provider-а |
  | `plugin-sdk/provider-web-fetch` | Допоміжні засоби web-fetch provider-а | Допоміжні засоби реєстрації/кешу provider-а web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Допоміжні засоби конфігурації web-search provider-а | Вузькі допоміжні засоби конфігурації/облікових даних web-search для provider-ів, яким не потрібна прив’язка ввімкнення Plugin |
  | `plugin-sdk/provider-web-search-contract` | Допоміжні засоби контракту web-search provider-а | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped сетери/гетери облікових даних |
  | `plugin-sdk/provider-web-search` | Допоміжні засоби web-search provider-а | Допоміжні засоби реєстрації/кешу/runtime provider-а web-search |
  | `plugin-sdk/provider-tools` | Допоміжні засоби сумісності tool/schema provider-а | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Допоміжні засоби використання provider-а | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` та інші допоміжні засоби використання provider-а |
  | `plugin-sdk/provider-stream` | Допоміжні засоби обгортки потоку provider-а | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку та спільні допоміжні засоби обгорток Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби транспорту provider-а | Нативні допоміжні засоби транспорту provider-а, як-от guarded fetch, перетворення транспортних повідомлень і потоки записуваних транспортних подій |
  | `plugin-sdk/keyed-async-queue` | Упорядкована асинхронна черга | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Спільні допоміжні засоби media | Допоміжні засоби fetch/transform/store media, а також білдери media payload |
  | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби генерації media | Спільні допоміжні засоби failover, вибір кандидатів і повідомлення про відсутні моделі для генерації зображень/відео/музики |
  | `plugin-sdk/media-understanding` | Допоміжні засоби media-understanding | Типи provider-ів media understanding, а також експорти допоміжних засобів зображень/аудіо для provider-ів |
  | `plugin-sdk/text-runtime` | Спільні текстові допоміжні засоби | Видалення тексту, видимого помічнику, допоміжні засоби рендерингу/чанкування/таблиць markdown, редагування, допоміжні засоби тегів директив, утиліти безпечного тексту та пов’язані допоміжні засоби тексту/логування |
  | `plugin-sdk/text-chunking` | Допоміжні засоби чанкування тексту | Допоміжний засіб чанкування вихідного тексту |
  | `plugin-sdk/speech` | Допоміжні засоби speech | Типи provider-ів speech, а також допоміжні засоби директив, реєстру та валідації для provider-ів |
  | `plugin-sdk/speech-core` | Спільне ядро speech | Типи provider-ів speech, реєстр, директиви, нормалізація |
  | `plugin-sdk/realtime-transcription` | Допоміжні засоби realtime transcription | Типи provider-ів, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
  | `plugin-sdk/realtime-voice` | Допоміжні засоби realtime voice | Типи provider-ів і допоміжні засоби реєстру |
  | `plugin-sdk/image-generation-core` | Спільне ядро генерації зображень | Типи генерації зображень, failover, auth і допоміжні засоби реєстру |
  | `plugin-sdk/music-generation` | Допоміжні засоби генерації музики | Типи provider-ів/запитів/результатів генерації музики |
  | `plugin-sdk/music-generation-core` | Спільне ядро генерації музики | Типи генерації музики, допоміжні засоби failover, пошук provider-а та аналіз model-ref |
  | `plugin-sdk/video-generation` | Допоміжні засоби генерації відео | Типи provider-ів/запитів/результатів генерації відео |
  | `plugin-sdk/video-generation-core` | Спільне ядро генерації відео | Типи генерації відео, допоміжні засоби failover, пошук provider-а та аналіз model-ref |
  | `plugin-sdk/interactive-runtime` | Допоміжні засоби інтерактивної відповіді | Нормалізація/зведення payload інтерактивної відповіді |
  | `plugin-sdk/channel-config-primitives` | Примітиви конфігурації channel-ів | Вузькі примітиви config-schema channel-ів |
  | `plugin-sdk/channel-config-writes` | Допоміжні засоби запису конфігурації channel-ів | Допоміжні засоби авторизації запису конфігурації channel-ів |
  | `plugin-sdk/channel-plugin-common` | Спільна преамбула channel-ів | Експорти спільної преамбули channel plugin-ів |
  | `plugin-sdk/channel-status` | Допоміжні засоби статусу channel-ів | Спільні допоміжні засоби snapshot/summary статусу channel-ів |
  | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби конфігурації allowlist | Допоміжні засоби редагування/читання конфігурації allowlist |
  | `plugin-sdk/group-access` | Допоміжні засоби доступу до груп | Спільні допоміжні засоби ухвалення рішень щодо доступу до груп |
  | `plugin-sdk/direct-dm` | Допоміжні засоби direct-DM | Спільні допоміжні засоби auth/guard direct-DM |
  | `plugin-sdk/extension-shared` | Спільні допоміжні засоби extension | Примітиви допоміжних засобів passive-channel/status і ambient proxy |
  | `plugin-sdk/webhook-targets` | Допоміжні засоби цілей Webhook | Допоміжні засоби реєстру цілей Webhook і встановлення маршрутів |
  | `plugin-sdk/webhook-path` | Допоміжні засоби шляхів Webhook | Допоміжні засоби нормалізації шляхів Webhook |
  | `plugin-sdk/web-media` | Спільні допоміжні засоби web media | Допоміжні засоби завантаження віддаленого/локального media |
  | `plugin-sdk/zod` | Повторний експорт Zod | Повторно експортований `zod` для споживачів Plugin SDK |
  | `plugin-sdk/memory-core` | Допоміжні засоби вбудованого memory-core | Поверхня допоміжних засобів менеджера пам’яті/конфігурації/файлів/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime рушія пам’яті | Фасад runtime індексу/пошуку пам’яті |
  | `plugin-sdk/memory-core-host-engine-foundation` | Базовий рушій хоста пам’яті | Експорти базового рушія хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Рушій embedding хоста пам’яті | Контракти embedding пам’яті, доступ до реєстру, локальний provider і узагальнені допоміжні засоби batch/remote; конкретні віддалені provider-и розміщуються у plugin-ах, яким вони належать |
  | `plugin-sdk/memory-core-host-engine-qmd` | Рушій QMD хоста пам’яті | Експорти рушія QMD хоста пам’яті |
  | `plugin-sdk/memory-core-host-engine-storage` | Рушій сховища хоста пам’яті | Експорти рушія сховища хоста пам’яті |
  | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті | Мультимодальні допоміжні засоби хоста пам’яті |
  | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті | Допоміжні засоби запитів хоста пам’яті |
  | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті | Допоміжні засоби секретів хоста пам’яті |
  | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті | Допоміжні засоби журналу подій хоста пам’яті |
  | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті | Допоміжні засоби статусу хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-cli` | CLI runtime хоста пам’яті | Допоміжні засоби CLI runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-core` | Базовий runtime хоста пам’яті | Допоміжні засоби базового runtime хоста пам’яті |
  | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті | Допоміжні засоби файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-core` | Псевдонім базового runtime хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів базового runtime хоста пам’яті |
  | `plugin-sdk/memory-host-events` | Псевдонім журналу подій хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
  | `plugin-sdk/memory-host-files` | Псевдонім файлів/runtime хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів файлів/runtime хоста пам’яті |
  | `plugin-sdk/memory-host-markdown` | Допоміжні засоби керованого markdown | Спільні допоміжні засоби керованого markdown для plugin-ів, суміжних із пам’яттю |
  | `plugin-sdk/memory-host-search` | Фасад пошуку Active Memory | Лінивий фасад runtime менеджера пошуку active memory |
  | `plugin-sdk/memory-host-status` | Псевдонім статусу хоста пам’яті | Нейтральний щодо постачальника псевдонім для допоміжних засобів статусу хоста пам’яті |
  | `plugin-sdk/memory-lancedb` | Допоміжні засоби вбудованого memory-lancedb | Поверхня допоміжних засобів memory-lancedb |
  | `plugin-sdk/testing` | Утиліти тестування | Допоміжні засоби тестування та mock-и |
</Accordion>

Ця таблиця навмисно є поширеною підмножиною для міграції, а не повною
поверхнею SDK. Повний список із понад 200 точок входу міститься в
`scripts/lib/plugin-sdk-entrypoints.json`.

Цей список усе ще включає деякі допоміжні поверхні вбудованих plugin-ів, як-от
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` і `plugin-sdk/matrix*`. Вони й надалі експортуються для
підтримки та сумісності вбудованих plugin-ів, але навмисно
не включені до поширеної таблиці міграції та не є рекомендованою ціллю для
нового коду plugin-ів.

Те саме правило застосовується й до інших сімейств вбудованих допоміжних засобів, таких як:

- допоміжні засоби підтримки браузера: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- поверхні вбудованих допоміжних засобів/plugin-ів, як-от `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` і `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` наразі надає вузьку
поверхню допоміжних засобів токенів `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken`.

Використовуйте найвужчий імпорт, який відповідає завданню. Якщо ви не можете знайти експорт,
перевірте вихідний код у `src/plugin-sdk/` або запитайте в Discord.

## Хронологія вилучення

| Коли                   | Що відбувається                                                         |
| ---------------------- | ----------------------------------------------------------------------- |
| **Зараз**              | Застарілі поверхні виводять попередження під час виконання              |
| **Наступний мажорний реліз** | Застарілі поверхні буде вилучено; plugin-и, які все ще їх використовують, не працюватимуть |

Усі core plugin-и вже мігровано. Зовнішнім plugin-ам слід виконати
міграцію до наступного мажорного релізу.

## Тимчасове приглушення попереджень

Установіть ці змінні середовища, поки працюєте над міграцією:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Це тимчасовий обхідний шлях, а не постійне рішення.

## Пов’язане

- [Початок роботи](/uk/plugins/building-plugins) — створіть свій перший Plugin
- [Огляд SDK](/uk/plugins/sdk-overview) — повний довідник імпортів підшляхів
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — створення channel plugin-ів
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — створення provider plugin-ів
- [Внутрішня будова plugin-ів](/uk/plugins/architecture) — детальний розбір архітектури
- [Маніфест Plugin](/uk/plugins/manifest) — довідник схеми маніфесту
