---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розміщені, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-28T01:47:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 67de782db5ef5a60ffe104ba67749590e70acb31f615e8c6e5049f688a3c2422
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK представлено як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці каталогізовано найуживаніші підшляхи, згруповані за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також наведені там, але є деталлю
  реалізації, якщо лише сторінка документації не просуває їх явно.

  Посібник з розробки Plugin див. у [Огляд Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Subpath                              | Ключові експорти                                                                                                                                    |
  | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`            | `definePluginEntry`                                                                                                                                 |
  | `plugin-sdk/core`                    | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`             |
  | `plugin-sdk/config-schema`           | `OpenClawSchema`                                                                                                                                    |
  | `plugin-sdk/provider-entry`          | `defineSingleProviderPluginEntry`                                                                                                                   |
  | `plugin-sdk/testing`                 | Широкий barrel сумісності для застарілих тестів Plugin; для нових тестів розширень віддавайте перевагу вузькоспрямованим тестовим підшляхам       |
  | `plugin-sdk/plugin-test-api`         | Мінімальний конструктор моків `OpenClawPluginApi` для прямих модульних тестів реєстрації Plugin                                                    |
  | `plugin-sdk/channel-test-helpers`    | Допоміжні засоби для тестування життєвого циклу облікових записів Channel, каталогів, send-config, моків runtime, hooks і загального контракту Channel |
  | `plugin-sdk/channel-target-testing`  | Спільний набір тестів для випадків помилок під час визначення цілі Channel                                                                          |
  | `plugin-sdk/plugin-test-contracts`   | Допоміжні засоби для контрактів реєстрації Plugin, маніфесту пакета, публічного артефакту, runtime API, побічних ефектів імпорту та прямого імпорту |
  | `plugin-sdk/plugin-test-runtime`     | Фікстури runtime Plugin, реєстру, реєстрації provider, майстра налаштування та TaskFlow runtime для тестів                                         |
  | `plugin-sdk/provider-test-contracts` | Допоміжні засоби для контрактів runtime provider, auth, discovery, onboard, catalog, web-search/fetch і майстра                                   |
  | `plugin-sdk/test-env`                | Фікстури тестового середовища, fetch/network, live-test, тимчасової файлової системи та керування часом                                            |
  | `plugin-sdk/test-fixtures`           | Загальні тестові фікстури для CLI, sandbox, Skills, agent-message, system-event, terminal, chunking, auth-token і typed-case                      |
  | `plugin-sdk/migration`               | Допоміжні засоби для елементів provider міграції, наприклад `createMigrationItem`, константи причин, маркери статусу елементів, засоби редагування та `summarizeMigrationItems` |
  | `plugin-sdk/migration-runtime`       | Допоміжні засоби runtime міграції, наприклад `copyMigrationFileItem` і `writeMigrationReport`                                                      |

  <AccordionGroup>
  <Accordion title="Підшляхи Channel">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої схеми Zod для `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби для майстра налаштування, prompt allowlist, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби для конфігурації та action-gate з кількома обліковими записами, а також для fallback облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби для нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні засоби для пошуку облікового запису та fallback за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для списків облікових записів і дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації Channel і універсальний конструктор |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації Channel для bundled OpenClaw лише для підтримуваних bundled Plugin |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий псевдонім сумісності для bundled-схем конфігурації Channel |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби для нормалізації/валідації користувацьких команд Telegram із fallback на bundled-контракт |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби для gate авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні засоби для життєвого циклу/фіналізації draft stream |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби для маршрутизації inbound і побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби для запису inbound і dispatch |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби для розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби для завантаження outbound media |
    | `plugin-sdk/outbound-send-deps` | Легковаговий пошук залежностей outbound send для адаптерів Channel |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби runtime для outbound delivery, identity, send delegate, session, formatting і планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби для нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби для життєвого циклу thread-binding і адаптерів |
    | `plugin-sdk/agent-media-payload` | Застарілий конструктор payload медіа agent |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби для прив’язки conversation/thread, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб для знімка конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби runtime для визначення group-policy |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби для знімків/зведень стану Channel |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації Channel |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації Channel |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти Plugin для Channel |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби для читання/редагування конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби для визначення доступу до груп |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби auth/guard для прямих DM |
    | `plugin-sdk/interactive-runtime` | Допоміжні засоби для семантичного представлення повідомлень, доставки та застарілих інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для debounce inbound, зіставлення згадок, допоміжних засобів mention-policy та envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби для debounce inbound |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби mention-policy, маркерів згадок і тексту згадок без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби для форматування inbound envelope |
    | `plugin-sdk/channel-location` | Допоміжні засоби для контексту Channel location і форматування |
    | `plugin-sdk/channel-logging` | Допоміжні засоби логування Channel для відкинутих inbound і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби для message-action у Channel, а також застарілі допоміжні засоби для native schema, збережені для сумісності Plugin |
    | `plugin-sdk/channel-route` | Спільні допоміжні засоби для нормалізації route, визначення цілей на основі parser, перетворення thread-id у рядок, ключів route для dedupe/compact, типів parsed-target і порівняння route/target |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору цілей; виклики порівняння route мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контракту Channel |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби контракту secret, зокрема `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей secret |
  </Accordion>

  <Accordion title="Підшляхи Provider">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад provider LM Studio для налаштування, виявлення каталогу та підготовки моделей runtime |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад runtime LM Studio для локальних типових параметрів сервера, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Добірні допоміжні засоби налаштування локальних/self-hosted provider |
    | `plugin-sdk/self-hosted-provider-setup` | Цілеспрямовані допоміжні засоби налаштування self-hosted provider, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Типові параметри бекенду CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби runtime для визначення API-key для provider Plugin |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/запису профілю API-key, наприклад `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор результату auth OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для provider Plugin |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env var для auth provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори replay-policy, допоміжні засоби кінцевих точок provider і допоміжні засоби нормалізації model-id, наприклад `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime для розширення каталогу provider і seams реєстру provider Plugin для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби HTTP/можливостей кінцевих точок provider, помилки HTTP provider і допоміжні засоби multipart form для транскрибування аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, наприклад `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для provider, яким не потрібне підключення enable Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, наприклад `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setters/getters облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також допоміжні засоби сумісності xAI, наприклад `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток stream і спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби native transport provider, зокрема guarded fetch, перетворення transport message і потоки подій transport із можливістю запису |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби виправлення конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби для режиму активації груп і розбору команд |
  </Accordion>

  <Accordion title="Підшляхи auth і безпеки">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Конструктори повідомлень команд/довідки, наприклад `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби для визначення approver і auth дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери native можливостей/доставки approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб для визначення Gateway approval |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковагові допоміжні засоби завантаження адаптера native approval для гарячих точок входу Channel |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби runtime для handler approval; віддавайте перевагу вужчим adapter/gateway seams, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби native target approval + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді approval для exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload approval для exec/plugin, допоміжні засоби маршрутизації/runtime native approval і допоміжні засоби структурованого відображення approval, наприклад `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби для скидання дедуплікації inbound reply |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контракту Channel без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Native auth команд, форматування меню динамічних аргументів і допоміжні засоби native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легковагові предикати тексту команд для гарячих шляхів Channel |
    | `plugin-sdk/command-surface` | Нормалізація тіла команди та допоміжні засоби command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь secret Channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби для trust, DM gating, external-content, редагування чутливого тексту, порівняння secret у сталий час і збирання secret |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF для allowlist хостів і приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої поверхні infra runtime |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, fetch із захистом SSRF, помилки SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору secret input |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запиту/цілі Webhook і приведення raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби для розміру тіла запиту/timeout |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби для runtime/logging/backup/встановлення Plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби для env runtime, logger, timeout, retry і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових параметрів, розбору URL CDP і допоміжних засобів auth browser-control |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні засоби для реєстрації та пошуку runtime-context Channel |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби для команд/hooks/http/interactive Plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби для pipeline Webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби для lazy-імпорту/прив’язки runtime, наприклад `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби для виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби для форматування CLI, очікування, версій, виклику аргументів і lazy-груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, CLI RPC Gateway, помилки протоколу Gateway і допоміжні засоби виправлення channel-status |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише для типів конфігурації Plugin, зокрема `OpenClawConfig` і типів конфігурації channel/provider |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби runtime для пошуку конфігурації Plugin, наприклад `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної мутації конфігурації, наприклад `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби для знімків конфігурації поточного процесу, наприклад `getRuntimeConfig`, `getRuntimeConfigSnapshot` і setters тестових знімків |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби для нормалізації назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли bundled-поверхня контракту Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби approval для exec/plugin, конструктори можливостей approval, допоміжні засоби auth/profile, допоміжні засоби native routing/runtime і форматування шляху структурованого відображення approval |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби inbound/reply runtime, chunking, dispatch, Heartbeat, планувальник reply |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби для dispatch/finalize reply і міток conversation |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби для reply-history у короткому вікні та маркери, наприклад `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби для chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби для шляху сховища сесій, ключа сесії, updated-at і мутацій сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби для шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби для шляхів каталогів state/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби для route/session-key/прив’язки облікового запису, наприклад `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби для зведень стану channel/account, типових станів runtime-state і метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби для визначення цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби для нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL із входів, подібних до fetch/request |
    | `plugin-sdk/run-command` | Виконавець команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені зчитувачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload із об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі send з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби для шляхів тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні засоби для logger підсистем і редагування |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби для режимів і перетворення таблиць Markdown |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби для перевизначення model/session, наприклад `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби для визначення конфігурації provider Talk |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби для читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні засоби для реентерабельного блокування файлів |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби для кешу дедуплікації на диску |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби ACP runtime/session і reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Визначення прив’язок ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації agent runtime |
    | `plugin-sdk/boolean-param` | Зчитувач параметрів boolean із м’яким приведенням |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби для визначення збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби для bootstrap пристрою і токенів pair |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів для passive-channel, статусу й ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби для команди `/models` і відповіді provider |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби для переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби для реєстру/build/serialize native команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness agent: типи harness, допоміжні засоби steer/abort активного запуску, допоміжні засоби мосту tool OpenClaw, допоміжні засоби політики tool для плану runtime, класифікація результатів terminal, допоміжні засоби для форматування/деталізації прогресу tool і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби для виявлення кінцевих точок Z.AI |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб process-local async lock для невеликих файлів стану runtime |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності Channel |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб для обмеженої конкурентності async-завдань |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби для кешу дедуплікації в пам’яті |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб для очищення черги очікуваної outbound-доставки |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби для безпечних шляхів локальних файлів і джерел медіа |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби для подій і видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Допоміжний засіб числового приведення |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби для безпечних токенів/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби для черги system event |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності transport |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте наведені вище вузькоспрямовані підшляхи runtime |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби для обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби для діагностичних прапорців, подій і trace-context |
    | `plugin-sdk/error-runtime` | Допоміжні засоби для графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні засоби для обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Зчитувач тіла відповіді з обмеженням без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки conversation без маршрутизації configured binding або сховищ pairing |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту і фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби для приведення й нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби для нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби для конфігурації retry і виконавця retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби для каталогу/ідентичності/робочого простору agent |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація каталогів на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби для fetch/transform/store медіа, а також конструктори payload медіа |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби сховища медіа, наприклад `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби для failover генерації медіа, вибору кандидатів і повідомлень про відсутні моделі |
    | `plugin-sdk/media-understanding` | Типи provider для розуміння медіа, а також експорти допоміжних засобів для зображень/аудіо, орієнтованих на provider |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби для text/markdown/logging, наприклад видалення тексту, видимого для assistant, допоміжні засоби для рендерингу/chunking/таблиць markdown, допоміжні засоби редагування, допоміжні засоби тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб для chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи provider мовлення, а також експорти допоміжних засобів директив, реєстру, валідації, конструктора TTS, сумісного з OpenAI, і мовлення, орієнтованих на provider |
    | `plugin-sdk/speech-core` | Спільні типи provider мовлення, а також експорти допоміжних засобів реєстру, директив, нормалізації та мовлення |
    | `plugin-sdk/realtime-transcription` | Типи provider для транскрибування в реальному часі, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи provider голосу в реальному часі та допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи provider генерації зображень, а також допоміжні засоби для image asset/data URL |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, допоміжні засоби failover, auth і реєстру |
    | `plugin-sdk/music-generation` | Типи provider/request/result генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби failover, пошуку provider і розбору model-ref |
    | `plugin-sdk/video-generation` | Типи provider/request/result генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби failover, пошуку provider і розбору model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні засоби реєстру цілей Webhook і встановлення route |
    | `plugin-sdk/webhook-path` | Допоміжні засоби для нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби для завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | Широкий barrel сумісності для застарілих тестів Plugin. Нові тести розширень мають імпортувати натомість вузькоспрямовані підшляхи SDK, наприклад `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний допоміжний засіб `createTestPluginApi` для прямих модульних тестів реєстрації Plugin без імпорту мостів допоміжних засобів тестування репозиторію |
    | `plugin-sdk/channel-test-helpers` | Допоміжні засоби тестування, орієнтовані на Channel, для загальних контрактів actions/setup/status, перевірок каталогів, життєвого циклу запуску облікових записів, потоків send-config, моків runtime, проблем статусу, вихідної доставки та реєстрації hooks |
    | `plugin-sdk/channel-target-testing` | Спільний набір перевірок випадків помилок під час визначення цілей для тестів Channel |
    | `plugin-sdk/plugin-test-contracts` | Допоміжні засоби контрактів для пакетів Plugin, реєстрації, публічних артефактів, прямого імпорту, runtime API та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Допоміжні засоби контрактів для runtime, auth, discovery, onboard, catalog, wizard, web-search/fetch і stream provider |
    | `plugin-sdk/test-fixtures` | Загальні фікстури для захоплення runtime CLI, контексту sandbox, записувача Skills, agent-message, system-event, terminal-text, chunking, auth-token і typed-case |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексації/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embeddings хоста пам’яті, доступ до реєстру, локальний provider і загальні допоміжні засоби для batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби runtime CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби базового runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний до вендора псевдонім для допоміжних засобів базового runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний до вендора псевдонім для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний до вендора псевдонім для допоміжних засобів файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби керованого markdown для Plugin, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний до вендора псевдонім для допоміжних засобів статусу хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Family | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки bundled browser Plugin. `browser-profiles` експортує `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` і `ResolvedBrowserTabCleanupConfig` для нормалізованої форми `browser.tabCleanup`. `browser-support` залишається barrel сумісності. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних засобів/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних засобів/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних засобів bundled IRC |
    | Допоміжні засоби, специфічні для Channel | `plugin-sdk/googlechat`, `plugin-sdk/googlechat-runtime-shared`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu`, `plugin-sdk/feishu-conversation`, `plugin-sdk/feishu-setup`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/telegram-command-ui`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` | Застарілі seams сумісності/допоміжних засобів bundled Channel. Нові Plugin мають імпортувати загальні підшляхи SDK або локальні barrel Plugin. |
    | Допоміжні засоби, специфічні для auth/Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/memory-core`, `plugin-sdk/memory-lancedb`, `plugin-sdk/opencode`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seams допоміжних засобів bundled-функцій/Plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
