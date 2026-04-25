---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту в Plugin
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розміщені, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-25T10:49:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f2e655d660a37030c53826b8ff156ac1897ecd3e753c1b0b43c75d456e2dfba
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK представлено як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено каталог часто використовуваних підшляхів, згрупованих за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також з’являються там, але є
  деталлю реалізації, якщо лише сторінка документації явно не просуває їх.

  Посібник з написання Plugin див. у [огляді Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Підшлях                    | Ключові експорти                                                                                                                       |
  | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні функції майстра налаштування, підказки allowlist, конструктори статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні функції конфігурації/керування доступом для кількох акаунтів, допоміжні функції резервного використання акаунта за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні функції нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні функції пошуку акаунта + резервного використання значення за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні функції списку акаунтів/дій з акаунтами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Типи схеми конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Допоміжні функції нормалізації/валідації користувацьких команд Telegram із резервним контрактом bundled |
    | `plugin-sdk/command-gating` | Вузькі допоміжні функції контролю авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні функції життєвого циклу/завершення чернеткового потоку |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні функції вхідної маршрутизації + побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні функції запису й диспетчеризації вхідних відповідей |
    | `plugin-sdk/messaging-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні функції завантаження вихідного медіа |
    | `plugin-sdk/outbound-runtime` | Допоміжні функції вихідної доставки, ідентичності, делегата надсилання, сесії, форматування й планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні функції нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні функції життєвого циклу thread-binding та адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий конструктор payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні функції conversation/thread binding, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжна функція знімка конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні функції визначення політики групи в runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні функції знімка/підсумку статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні функції авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти Plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні функції редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні функції ухвалення рішень щодо доступу до груп |
    | `plugin-sdk/direct-dm` | Спільні допоміжні функції авторизації/захисту прямих DM |
    | `plugin-sdk/interactive-runtime` | Семантичне подання повідомлень, доставка та застарілі допоміжні функції інтерактивних відповідей. Див. [Подання повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Compatibility barrel для debounce вхідних повідомлень, зіставлення згадок, допоміжних функцій політики згадок і envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні функції debounce вхідних повідомлень |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні функції політики згадок і тексту згадок без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні функції форматування вхідного envelope |
    | `plugin-sdk/channel-location` | Допоміжні функції контексту й форматування розташування каналу |
    | `plugin-sdk/channel-logging` | Допоміжні функції логування каналу для відкидання вхідних повідомлень і помилок typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результату відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні функції дій із повідомленнями каналу, а також застарілі допоміжні функції нативної схеми, збережені для сумісності Plugin |
    | `plugin-sdk/channel-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції контракту секретів, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей секретів |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Добірні допоміжні функції налаштування локального/self-hosted провайдера |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні функції налаштування self-hosted провайдера, сумісного з OpenAI |
    | `plugin-sdk/cli-backend` | Значення за замовчуванням для бекенда CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні функції визначення API-ключа в runtime для Plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні функції онбордингу API-ключа/запису профілю, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор результату OAuth-автентифікації |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні функції інтерактивного входу для Plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні функції пошуку env vars для автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори replay-policy, допоміжні функції endpoint провайдера й нормалізації model-id, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні функції HTTP/можливостей endpoint провайдера, помилки HTTP провайдера та допоміжні функції multipart form для аудіотранскрипції |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні функції контракту конфігурації/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні функції реєстрації/кешування провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні функції конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення enable Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні функції контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні функції реєстрації/кешування/runtime для провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні функції сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку та спільні допоміжні функції обгорток для Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні функції нативного транспорту провайдера, як-от guarded fetch, трансформації transport message і writable transport event streams |
    | `plugin-sdk/provider-onboard` | Допоміжні функції виправлення конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні функції process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні функції режиму активації групи та розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні функції реєстру команд, включно з форматуванням меню динамічних аргументів, допоміжні функції авторизації відправника |
    | `plugin-sdk/command-status` | Конструктори повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні функції визначення затверджувача й авторизації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні функції профілю/фільтра нативного затвердження exec |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери можливостей/доставки нативного затвердження |
    | `plugin-sdk/approval-gateway-runtime` | Спільна допоміжна функція визначення Gateway для затвердження |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковагові допоміжні функції завантаження адаптера нативного затвердження для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні функції runtime для обробника затвердження; віддавайте перевагу вужчим адаптерним/Gateway seam, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні функції цілі нативного затвердження + прив’язки акаунта |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні функції payload відповіді для затвердження exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні функції payload затвердження exec/plugin, допоміжні функції маршрутизації/runtime нативного затвердження та допоміжні функції структурованого відображення затвердження, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні функції скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні функції тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і допоміжні функції цілей нативної сесії |
    | `plugin-sdk/command-detection` | Спільні допоміжні функції виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легковагові предикати тексту команд для гарячих шляхів каналу |
    | `plugin-sdk/command-surface` | Допоміжні функції нормалізації тіла команди та command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції збирання secret-contract для поверхонь секретів каналу/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні функції `coerceSecretRef` і типізації SecretRef для парсингу secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні функції довіри, контролю DM, зовнішнього контенту та збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні функції allowlist хостів і політики SSRF для приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні функції pinned dispatcher без широкої infra-runtime поверхні |
    | `plugin-sdk/ssrf-runtime` | Допоміжні функції pinned dispatcher, fetch із захистом від SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні функції парсингу секретного вводу |
    | `plugin-sdk/webhook-ingress` | Допоміжні функції запиту/цілі Webhook |
    | `plugin-sdk/webhook-request-guards` | Допоміжні функції розміру тіла запиту/тайм-ауту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні функції runtime/логування/резервного копіювання/встановлення plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні функції env runtime, logger, timeout, retry і backoff |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні функції реєстрації та пошуку runtime-context каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні функції команд/hook/http/interactive для plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні функції pipeline для Webhook/внутрішніх hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні функції lazy імпорту/runtime binding, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні функції виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні функції форматування CLI, очікування, версії, виклику аргументів і lazy груп команд |
    | `plugin-sdk/gateway-runtime` | Допоміжні функції клієнта Gateway і patch статусу каналу |
    | `plugin-sdk/config-runtime` | Допоміжні функції завантаження/запису конфігурації та пошуку конфігурації plugin |
    | `plugin-sdk/telegram-command-config` | Допоміжні функції нормалізації назв/описів команд Telegram і перевірок на дублікати/конфлікти, навіть коли поверхня контракту bundled Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink для посилань на файли без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Допоміжні функції затвердження exec/plugin, конструктори approval capability, допоміжні функції auth/profile, нативної маршрутизації/runtime і форматування шляху структурованого відображення затвердження |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні функції runtime для вхідних повідомлень/відповідей, chunking, dispatch, Heartbeat, планувальник відповіді |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні функції dispatch/finalize відповіді та міток conversation |
    | `plugin-sdk/reply-history` | Спільні допоміжні функції history відповідей для короткого вікна, як-от `buildHistoryContext`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні функції chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні функції шляху сховища сесій + `updated-at` |
    | `plugin-sdk/state-paths` | Допоміжні функції шляхів до каталогів state/OAuth |
    | `plugin-sdk/routing` | Допоміжні функції прив’язки route/session-key/account, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні функції підсумку статусу каналу/акаунта, значення стану runtime за замовчуванням і допоміжні функції метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні функції визначення цілі |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні функції нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування URL-рядків із fetch/request-подібних вхідних даних |
    | `plugin-sdk/run-command` | Runner команд із таймінгом і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені читачі параметрів інструментів/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об’єктів результатів інструментів |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів інструмента |
    | `plugin-sdk/temp-path` | Спільні допоміжні функції шляхів для тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні функції логера підсистеми та редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні функції режиму та перетворення таблиць Markdown |
    | `plugin-sdk/json-store` | Невеликі допоміжні функції читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні функції повторно вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні функції дедуплікаційного кешу зберігання на диску |
    | `plugin-sdk/acp-runtime` | Допоміжні функції runtime/сесії ACP і dispatch відповіді |
    | `plugin-sdk/acp-binding-resolve-runtime` | Визначення прив’язки ACP тільки для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Гнучкий читач булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні функції визначення збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні функції bootstrap пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних функцій passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні функції відповіді команди `/models`/провайдера |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні функції виведення списку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні функції реєстру/побудови/серіалізації нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агента: типи harness, допоміжні функції steer/abort для active-run, допоміжні функції мосту інструментів OpenClaw, форматування/деталізація прогресу інструментів і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні функції визначення endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Допоміжні функції системних подій/Heartbeat |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні функції обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні функції діагностичних прапорців і подій |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні допоміжні функції класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні функції обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Читач тіла відповіді з обмеженням без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки conversation без маршрутизації configured binding або сховищ pairing |
    | `plugin-sdk/session-store-runtime` | Допоміжні функції читання сховища сесій без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту та фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні функції приведення та нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні функції нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні функції конфігурації retry і runner retry |
    | `plugin-sdk/agent-runtime` | Допоміжні функції каталогу/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/dedup каталогів на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні функції fetch/transform/store для медіа, а також конструктори media payload |
    | `plugin-sdk/media-store` | Вузькі допоміжні функції сховища медіа, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні функції failover для генерації медіа, вибір candidate і повідомлення про відсутні моделі |
    | `plugin-sdk/media-understanding` | Типи провайдера media understanding, а також експорти допоміжних функцій для зображень/аудіо, орієнтованих на провайдер |
    | `plugin-sdk/text-runtime` | Спільні допоміжні функції text/markdown/logging, як-от вилучення видимого для асистента тексту, допоміжні функції render/chunking/table для markdown, редагування чутливих даних, допоміжні функції тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжна функція chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдера мовлення, а також експорти директив, реєстру, валідації та допоміжних функцій мовлення, орієнтованих на провайдер |
    | `plugin-sdk/speech-core` | Спільні типи провайдера мовлення, а також експорти реєстру, директив, нормалізації та допоміжних функцій мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдера транскрипції в реальному часі, допоміжні функції реєстру та спільна допоміжна функція сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдера голосу в реальному часі та допоміжні функції реєстру |
    | `plugin-sdk/image-generation` | Типи провайдера генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, допоміжні функції failover, auth і реєстру |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні функції failover, пошук провайдера й парсинг model-ref |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні функції failover, пошук провайдера й парсинг model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні функції реєстру цілей Webhook і встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні функції нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні функції завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Підшляхи Memory">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних функцій bundled memory-core для менеджера/конфігурації/файлів/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime для індексу/пошуку memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста memory, доступ до реєстру, локальний провайдер і загальні пакетні/віддалені допоміжні функції |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста memory |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні функції хоста memory |
    | `plugin-sdk/memory-core-host-query` | Допоміжні функції запитів хоста memory |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні функції секретів хоста memory |
    | `plugin-sdk/memory-core-host-events` | Допоміжні функції журналу подій хоста memory |
    | `plugin-sdk/memory-core-host-status` | Допоміжні функції статусу хоста memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні функції CLI runtime хоста memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Основні допоміжні функції runtime хоста memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні функції файлів/runtime хоста memory |
    | `plugin-sdk/memory-host-core` | Нейтральний до постачальника псевдонім для основних допоміжних функцій runtime хоста memory |
    | `plugin-sdk/memory-host-events` | Нейтральний до постачальника псевдонім для допоміжних функцій журналу подій хоста memory |
    | `plugin-sdk/memory-host-files` | Нейтральний до постачальника псевдонім для допоміжних функцій файлів/runtime хоста memory |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні функції керованого markdown для plugin, суміжних із memory |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до менеджера пошуку |
    | `plugin-sdk/memory-host-status` | Нейтральний до постачальника псевдонім для допоміжних функцій статусу хоста memory |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних функцій bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Сімейство | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Браузер | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні функції підтримки bundled browser plugin. `browser-profiles` експортує `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` і `ResolvedBrowserTabCleanupConfig` для нормалізованої форми `browser.tabCleanup`. `browser-support` залишається compatibility barrel. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних функцій/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних функцій/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних функцій bundled IRC |
    | Допоміжні функції, специфічні для каналів | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Compatibility seam/допоміжні seam для bundled каналів |
    | Допоміжні функції, специфічні для auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Допоміжні seam для bundled функцій/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugin](/uk/plugins/building-plugins)
