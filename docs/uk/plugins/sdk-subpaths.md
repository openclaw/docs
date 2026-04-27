---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту plugin
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розміщені, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-27T22:22:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56f76f2371500ab77dc791ba862cb628daec596059f1f9def7227fecb2826347
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK представлений як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено каталог поширено вживаних підшляхів, згрупованих за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також наведені там, але є деталями
  реалізації, якщо лише сторінка документації явно не просуває їх.

  Посібник з розробки plugin див. у [Огляд Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу plugin

  | Subpath                        | Основні експорти                                                                                                                                        |
  | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                      |
  | `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                   |
  | `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                         |
  | `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                        |
  | `plugin-sdk/migration`         | Допоміжні засоби елементів провайдера міграції, такі як `createMigrationItem`, константи причин, маркери статусу елементів, засоби редагування та `summarizeMigrationItems` |
  | `plugin-sdk/migration-runtime` | Допоміжні засоби міграції під час виконання, такі як `copyMigrationFileItem` і `writeMigrationReport`                                                   |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Subpath | Основні експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, підказки allowlist, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби багатокористувацького конфігу/керування шлюзами дій, допоміжні засоби резервного переходу до типового облікового запису |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису + резервного переходу до типового |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для списків облікових записів/дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігу каналу та узагальнений побудовник |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілі схеми конфігу bundled-channel лише для сумісності з вбудованими компонентами |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із резервною сумісністю з bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні засоби життєвого циклу/фіналізації потоку чернеток |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби побудови вхідних маршрутів і envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису й диспетчеризації вхідних повідомлень |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-send-deps` | Полегшений пошук залежностей вихідного надсилання для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідної доставки, ідентичності, делегата надсилання, сесій, форматування та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Життєвий цикл прив’язок потоків та допоміжні засоби адаптерів |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник agent media payload |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби для прив’язки розмов/потоків, pairинг і налаштованих прив’язок |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб знімка конфігурації під час виконання |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби визначення групових політик під час виконання |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби знімка/підсумку стану каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігу каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігу каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби для рішень щодо групового доступу |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби авторизації/захисту прямих DM |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі допоміжні засоби інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Сумісний barrel для debounce вхідних повідомлень, зіставлення згадок, допоміжних засобів політики згадок та допоміжних засобів envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби debounce для вхідних повідомлень |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби політики згадок, маркерів згадок і тексту згадок без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби форматування вхідних envelope |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту розташування каналу та форматування |
    | `plugin-sdk/channel-logging` | Допоміжні засоби журналювання каналу для відкинутих вхідних повідомлень і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби дій із повідомленнями каналу, а також застарілі рідні допоміжні засоби схем, збережені для сумісності plugin |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контрактів каналу |
    | `plugin-sdk/channel-feedback` | Підключення зворотного зв’язку/реакцій |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби контрактів секретів, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей секретів |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Subpath | Основні експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделей під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний runtime-фасад LM Studio для типових локальних серверів, виявлення моделей, заголовків запитів і допоміжних засобів завантажених моделей |
    | `plugin-sdk/provider-setup` | Кураторський набір допоміжних засобів налаштування локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Типові значення CLI backend + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API-ключа під час виконання для plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу API-ключів/запису профілів, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату OAuth-автентифікації |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env vars для автентифікації провайдерів |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політик повтору, допоміжні засоби endpoint провайдерів і допоміжні засоби нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Хуки runtime каталогу провайдерів і шви реєстру plugin-провайдерів для тестів контрактів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби HTTP/endpoint-можливостей провайдерів, помилки HTTP провайдерів і допоміжні засоби multipart form для аудіотранскрипції |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контрактів конфігурації/вибору web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування провайдерів web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення увімкнення plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контрактів конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter для облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime для провайдерів web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Власні допоміжні засоби транспортного рівня провайдерів, такі як guarded fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби патчів конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації груп і розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Subpath | Основні експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, включно з форматуванням меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення затверджувача та автентифікації дій у тому ж чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра native exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Native-адаптери можливостей/доставки approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб визначення gateway для approval |
    | `plugin-sdk/approval-handler-adapter-runtime` | Полегшені допоміжні засоби завантаження native-адаптерів approval для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші runtime-допоміжні засоби для approval; віддавайте перевагу вужчим адаптерним/Gateway-швам, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби native approval target + прив’язки облікових записів |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповідей для exec/plugin approval |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload для exec/plugin approval, native-допоміжні засоби маршрутизації/runtime approval і допоміжні засоби структурованого відображення approval, такі як `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контрактів каналів без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Native-автентифікація команд, форматування меню динамічних аргументів і native-допоміжні засоби цілей сесій |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Полегшені предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Нормалізація тіла команд і допоміжні засоби поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання секретних контрактів для поверхонь секретів channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору секретних контрактів/конфігурації |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, DM gating, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів у сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF для allowlist хостів і приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої infra runtime-поверхні |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, fetch із захистом SSRF, помилка SSRF і допоміжні засоби політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору секретного введення |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів/цілей Webhook і приведення raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру тіла запиту/тайм-аутів |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Subpath | Основні експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі runtime/логування/резервного копіювання/встановлення plugin допоміжні засоби |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових значень, розбору CDP URL і допоміжних засобів автентифікації browser-control |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні засоби реєстрації та пошуку runtime-context каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби command/hook/http/interactive для plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби pipeline Webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy runtime import/binding, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версій, виклику аргументів і lazy command-group |
    | `plugin-sdk/gateway-runtime` | Допоміжні засоби Gateway client, Gateway CLI RPC, помилок протоколу Gateway і патчів статусу каналу |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише для типів для форм конфігурації plugin, таких як `OpenClawConfig` і типи конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Runtime-допоміжні засоби пошуку plugin-config, такі як `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної мутації конфігурації, такі як `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка конфігурації поточного процесу, такі як `getRuntimeConfig`, `getRuntimeConfigSnapshot` і setter-и тестових знімків |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли поверхня контракту bundled Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink посилань на файли без широкого text-runtime barrel |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби exec/plugin approval, побудовники можливостей approval, допоміжні засоби auth/profile, native-допоміжні засоби routing/runtime і форматування шляху структурованого відображення approval |
    | `plugin-sdk/reply-runtime` | Спільні runtime-допоміжні засоби inbound/reply, розбиття на частини, диспетчеризація, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації/фіналізації відповідей і міток розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби short-window history відповідей і маркери, такі як `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сесій, ключа сесії, updated-at і мутацій сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів директорій state/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби маршрутизації/ключа сесії/прив’язки облікових записів, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби підсумку стану каналу/облікового запису, типові значення runtime-state і допоміжні засоби метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби визначення цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL з fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Запускач команд із таймуванням і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені зчитувачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні засоби logger підсистем і редагування |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму таблиць Markdown і перетворення |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення model/session, такі як `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби визначення конфігурації talk provider |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису JSON state |
    | `plugin-sdk/file-lock` | Допоміжні засоби реентерабельного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби дедуплікаційного кешу зберігання на диску |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби ACP runtime/session і диспетчеризації відповідей |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання прив’язки ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації agent runtime |
    | `plugin-sdk/boolean-param` | Нестрогий зчитувач булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби визначення збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби початкового налаштування пристрою та pairing token |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповідей команди `/models`/провайдера |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/build/serialize native-команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness agent: типи harness, допоміжні засоби steer/abort активного запуску, допоміжні засоби мосту OpenClaw tool, допоміжні засоби політики runtime-plan tool, класифікація результатів terminal, допоміжні засоби форматування/деталізації прогресу tool і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб process-local async lock для невеликих runtime state-файлів |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеженої конкурентності async-завдань |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби кешу дедуплікації в пам’яті |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб очищення черги очікуваної вихідної доставки |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів до локальних файлів і джерел медіа |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби подій і видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Допоміжний засіб приведення чисел |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних токенів/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте сфокусовані runtime-підшляхи вище |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичних прапорців, подій і trace-context |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Допоміжний засіб читання обмеженого response-body без широкої media runtime-поверхні |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки розмови без routing налаштованих прив’язок або pairing stores |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту та фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення та нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і запуску retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби директорії/ідентичності/робочого простору agent |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація директорій на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Subpath | Основні експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби отримання/перетворення/збереження медіа, а також побудовники media payload |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби сховища медіа, такі як `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover для генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти image/audio helper для провайдерів |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби text/markdown/logging, такі як видалення assistant-visible-text, допоміжні засоби render/chunking/table для markdown, допоміжні засоби редагування, допоміжні засоби тегів директив і утиліти safe-text |
    | `plugin-sdk/text-chunking` | Допоміжний засіб chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи speech provider, а також експорти directive, registry, validation і speech helper для провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи speech provider, registry, directive, normalization і експорти speech helper |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, допоміжні засоби registry і спільний допоміжний засіб WebSocket session |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та допоміжні засоби registry |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, допоміжні засоби failover, auth і registry |
    | `plugin-sdk/music-generation` | Типи провайдерів/запитів/результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби failover, пошук провайдерів і розбір model-ref |
    | `plugin-sdk/video-generation` | Типи провайдерів/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби failover, пошук провайдерів і розбір model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні засоби реєстру цілей Webhook і встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | Публічні допоміжні засоби тестування extensions, включно з mock-об’єктами registry/runtime plugin, fetch/env/temp fixtures, допоміжними засобами schema/media/live-test, `installCommonResolveTargetErrorCases`, `writeSkill`, `createTestRegistry` і завантаженням env для live generation. Допоміжні засоби Extension `*.test-support.ts` мають залишатися тут або у сфокусованих підшляхах SDK, а не у внутрішніх компонентах core |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Subpath | Основні експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для manager/config/file/CLI helper |
    | `plugin-sdk/memory-core-engine-runtime` | Runtime-фасад індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine host-а пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding host-а пам’яті, доступ до registry, локальний провайдер і загальні пакетні/віддалені helper |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine host-а пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти engine сховища host-а пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні helper host-а пам’яті |
    | `plugin-sdk/memory-core-host-query` | Helper запитів host-а пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Helper секретів host-а пам’яті |
    | `plugin-sdk/memory-core-host-events` | Helper журналу подій host-а пам’яті |
    | `plugin-sdk/memory-core-host-status` | Helper статусу host-а пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Runtime helper CLI host-а пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Core runtime helper host-а пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | File/runtime helper host-а пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний до вендора псевдонім для core runtime helper host-а пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний до вендора псевдонім для helper журналу подій host-а пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний до вендора псевдонім для file/runtime helper host-а пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні helper керованого markdown для plugin, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Runtime-фасад Active Memory для доступу до менеджера пошуку |
    | `plugin-sdk/memory-host-status` | Нейтральний до вендора псевдонім для helper статусу host-а пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Family | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки bundled browser plugin. `browser-profiles` експортує `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` і `ResolvedBrowserTabCleanupConfig` для нормалізованої форми `browser.tabCleanup`. `browser-support` залишається compatibility barrel. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня helper/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня helper/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня helper bundled IRC |
    | Специфічні для каналів helper | `plugin-sdk/googlechat`, `plugin-sdk/googlechat-runtime-shared`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu`, `plugin-sdk/feishu-conversation`, `plugin-sdk/feishu-setup`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/telegram-command-ui`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` | Застарілі шви сумісності/helper для bundled channel. Нові plugins повинні імпортувати загальні підшляхи SDK або plugin-local barrel. |
    | Helper автентифікації/специфічні для plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/memory-core`, `plugin-sdk/memory-lancedb`, `plugin-sdk/opencode`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Шви helper для bundled feature/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
