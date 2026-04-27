---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту плагіна
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де знаходяться, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-27T23:18:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb4fdb61b69fc045b6ba94efe8430e761812e2e21dea9abac653b527ad11f195
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK надається як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  Ця сторінка каталогізує найуживаніші підшляхи, згруповані за призначенням. Згенерований
  повний список із понад 200 підшляхів розміщено в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також наведено там, але вони є
  деталлю реалізації, якщо тільки сторінка документації явно не просуває їх.

  Посібник з авторства плагінів див. у [Огляд Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу плагіна

  | Підшлях                       | Ключові експорти                                                                                                                                       |
  | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`     | `definePluginEntry`                                                                                                                                   |
  | `plugin-sdk/core`             | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`              |
  | `plugin-sdk/config-schema`    | `OpenClawSchema`                                                                                                                                      |
  | `plugin-sdk/provider-entry`   | `defineSingleProviderPluginEntry`                                                                                                                     |
  | `plugin-sdk/testing`          | Публічні тестові фікстури плагінів, допоміжні засоби реєстрації/каталогу провайдерів, хуки контракту майстра та допоміжні засоби підтримки контрактів bundled-plugin |
  | `plugin-sdk/migration`        | Допоміжні засоби елементів провайдера міграції, такі як `createMigrationItem`, константи причин, маркери статусу елементів, допоміжні засоби редагування чутливих даних і `summarizeMigrationItems` |
  | `plugin-sdk/migration-runtime` | Допоміжні засоби міграції під час виконання, такі як `copyMigrationFileItem` і `writeMigrationReport`                                              |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, запити allowlist, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби багатокористувацьких конфігурацій/шлюзів дій, допоміжні засоби резервного використання облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації ідентифікатора облікового запису |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису + резервного використання типового значення |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для списку облікових записів/дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу та універсальний побудовник |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілі схеми конфігурації bundled-channel лише для сумісності з bundled |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із резервною сумісністю для bundled-контракту |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні засоби життєвого циклу/фіналізації чернеткового потоку |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби маршрутизації вхідних даних + побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису й диспетчеризації вхідних відповідей |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-send-deps` | Легковаговий пошук залежностей вихідного надсилання для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідної доставки, ідентичності, делегата надсилання, сесії, форматування та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу прив’язок потоків і адаптерів |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби прив’язки розмов/потоків, pairing і налаштованих прив’язок |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб знімка конфігурації під час виконання |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби визначення групової політики під час виконання |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби знімка/зведення стану каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти прелюдії плагіна каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби читання/редагування конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби прийняття рішень щодо групового доступу |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби auth/guard для прямих DM |
    | `plugin-sdk/interactive-runtime` | Семантичні допоміжні засоби подання повідомлень, доставки та застарілих інтерактивних відповідей. Див. [Подання повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для debounce вхідних даних, зіставлення згадок, допоміжних засобів політики згадок і допоміжних засобів envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби debounce вхідних даних |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби політики згадок, маркерів згадок і тексту згадок без ширшої поверхні runtime вхідних даних |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби форматування вхідного envelope |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту розташування каналу та форматування |
    | `plugin-sdk/channel-logging` | Допоміжні засоби журналювання каналу для відкинутих вхідних даних і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби дій із повідомленнями каналу, а також застарілі допоміжні засоби нативної схеми, збережені для сумісності плагінів |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Зв’язування feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби контракту секретів, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей секретів |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделі під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад runtime LM Studio для локальних типових значень сервера, виявлення моделей, заголовків запитів і допоміжних засобів завантажених моделей |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Типові значення бекенда CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API-ключа під час виконання для плагінів провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/запису профілю API-ключа, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату auth OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для плагінів провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env vars для auth провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політики replay, допоміжні засоби endpoint провайдера та допоміжні засоби нормалізації ідентифікатора моделі, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Хук runtime каталогу провайдера та seams реєстру plugin-provider для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Універсальні допоміжні засоби можливостей HTTP/endpoint провайдера, помилки HTTP провайдера та допоміжні засоби multipart form для аудіотранскрипції |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешу провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне зв’язування ввімкнення плагіна |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і засоби встановлення/отримання облікових даних з областю дії |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешу/runtime провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку та спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Нативні допоміжні засоби транспорту провайдера, такі як guarded fetch, перетворення транспортних повідомлень і потоки подій транспорту з можливістю запису |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби виправлення конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації групи та розбору команд |
  </Accordion>

  <Accordion title="Підшляхи auth і безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, включно з форматуванням меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники команд/довідкових повідомлень, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення погоджувача та auth дій у межах того самого чату |
    | `plugin-sdk/approval-client-runtime` | Нативні допоміжні засоби профілю/фільтра погодження exec |
    | `plugin-sdk/approval-delivery-runtime` | Нативні адаптери можливостей/доставки погодження |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб визначення Gateway погодження |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковагові допоміжні засоби завантаження нативного адаптера погодження для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби runtime обробника погодження; віддавайте перевагу вужчим adapter/gateway seams, якщо їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Нативні допоміжні засоби цілі погодження + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді на погодження exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload погодження exec/plugin, нативні допоміжні засоби маршрутизації/runtime погодження та структуровані допоміжні засоби відображення погодження, такі як `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативний auth команд, форматування меню динамічних аргументів і нативні допоміжні засоби цілі сесії |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легковагові предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Нормалізація тіла команди та допоміжні засоби поверхні команди |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання секретного контракту для поверхонь секретів каналу/плагіна |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору секретного контракту/конфігурації |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, DM gating, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів у сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF для allowlist хостів і приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої runtime-поверхні infra |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, fetch із захистом SSRF, помилки SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запиту/цілі Webhook і приведення необробленого websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру body/тайм-ауту запиту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/логування/резервного копіювання/встановлення плагінів |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових значень, розбору URL CDP і допоміжних засобів auth керування браузером |
    | `plugin-sdk/channel-runtime-context` | Універсальні допоміжні засоби реєстрації та пошуку runtime-context каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/хуків/http/інтерактивності плагіна |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби конвеєра Webhook/внутрішніх хуків |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби ледачого імпорту/прив’язки runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби exec процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версії, виклику аргументів і ледачих груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, CLI RPC Gateway, помилки протоколу Gateway і допоміжні засоби patch стану каналу |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише для типів для форм конфігурації плагінів, таких як `OpenClawConfig` і типи конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку конфігурації плагіна під час виконання, такі як `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної мутації конфігурації, такі як `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка конфігурації поточного процесу, такі як `getRuntimeConfig`, `getRuntimeConfigSnapshot` і засоби встановлення тестових знімків |
    | `plugin-sdk/telegram-command-config` | Нормалізація назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли поверхня контракту bundled Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink посилань на файли без широкого text-runtime barrel |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби погодження exec/plugin, побудовники можливостей погодження, допоміжні засоби auth/профілю, нативні допоміжні засоби маршрутизації/runtime і форматування шляху структурованого відображення погодження |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби runtime вхідних даних/відповідей, чанкування, диспетчеризація, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації/завершення відповіді та міток розмови |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби коротковіконної історії відповідей і маркери, такі як `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби чанкування text/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сесій, ключа сесії, updated-at і мутації сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів каталогів стану/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби маршруту/ключа сесії/прив’язки облікового запису, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби зведення стану каналу/облікового запису, типові значення стану runtime та допоміжні засоби метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби визначення цілі |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL із входів на кшталт fetch/request |
    | `plugin-sdk/run-command` | Виконавець команд із таймінгом і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені читачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні засоби логера підсистеми й редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму та перетворення таблиць Markdown |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення моделі/сесії, такі як `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби визначення конфігурації провайдера talk |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Повторно вхідні допоміжні засоби блокування файлів |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу дедуплікації з опорою на диск |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби runtime/сесії ACP і диспетчеризації відповідей |
    | `plugin-sdk/acp-binding-resolve-runtime` | Визначення прив’язки ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Читач нестрогих булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби визначення відповідності небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою й токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді команди `/models`/провайдера |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби виведення списку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/побудови/серіалізації нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агента: типи harness, допоміжні засоби steer/abort активного запуску, допоміжні засоби мосту tool OpenClaw, допоміжні засоби політики tools плану runtime, класифікація результатів terminal, допоміжні засоби форматування/деталізації прогресу tools і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб process-local async lock для невеликих файлів стану runtime |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеженої конкурентності асинхронних завдань |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби кешу дедуплікації в пам’яті |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб очищення черги очікуваної вихідної доставки |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів локальних файлів і джерел медіа |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби подій і видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Допоміжний засіб числового приведення |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних токенів/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте сфокусовані runtime-підшляхи вище |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби прапорців, подій і trace-context діагностики |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні допоміжні засоби класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Читач обмеженого body відповіді без широкої runtime-поверхні медіа |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки розмови без маршрутизації налаштованих прив’язок або сховищ pairing |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту та фільтрація додаткового контексту без широких імпортів конфігурації/безпеки |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення та нормалізації примітивних записів/рядків без імпортів markdown/логування |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації імені хоста й хоста SCP |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і виконавця retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогу/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація каталогів з опорою на конфігурацію |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби отримання/перетворення/зберігання медіа, а також побудовники медіа payload |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби сховища медіа, такі як `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover для генерації медіа, вибору кандидатів і повідомлень про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдера розуміння медіа, а також експорти допоміжних засобів зображень/аудіо для провайдерів |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби text/markdown/logging, такі як видалення видимого для асистента тексту, допоміжні засоби рендерингу/чанкування/таблиць markdown, допоміжні засоби редагування чутливих даних, допоміжні засоби тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб чанкування вихідного text |
    | `plugin-sdk/speech` | Типи провайдера мовлення, а також експорти допоміжних засобів директив, реєстру, валідації та мовлення для провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи провайдера мовлення, а також експорти допоміжних засобів реєстру, директив, нормалізації та мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдера транскрипції в реальному часі, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдера голосу в реальному часі та допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи провайдера генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, допоміжні засоби failover, auth і реєстру |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби failover, пошук провайдера та розбір model-ref |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби failover, пошук провайдера та розбір model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні засоби реєстру цілей Webhook і встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | Публічні допоміжні засоби тестування extension, включно з mock-об’єктами реєстру/runtime плагінів, захопленням реєстрації провайдера, допоміжними засобами майстра налаштування, фікстурами fetch/env/temp/time, допоміжними засобами schema/media/live-test, `installCommonResolveTargetErrorCases`, `writeSkill`, `createTestRegistry` і завантаженням env для live generation. Допоміжні засоби extension `*.test-support.ts` мають залишатися тут або у сфокусованих підшляхах SDK, а не у внутрішніх модулях core |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для менеджера/конфігурації/файлів/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний провайдер і універсальні допоміжні засоби пакетної/віддаленої обробки |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби стану хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби runtime CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Основні допоміжні засоби runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний щодо постачальника псевдонім для основних допоміжних засобів runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний щодо постачальника псевдонім для допоміжних засобів файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби керованого markdown для плагінів, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до менеджера пошуку |
    | `plugin-sdk/memory-host-status` | Нейтральний щодо постачальника псевдонім для допоміжних засобів стану хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Сімейство | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки bundled browser plugin. `browser-profiles` експортує `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` і `ResolvedBrowserTabCleanupConfig` для нормалізованої форми `browser.tabCleanup`. `browser-support` залишається compatibility barrel. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних засобів/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних засобів/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних засобів bundled IRC |
    | Допоміжні засоби для конкретних каналів | `plugin-sdk/googlechat`, `plugin-sdk/googlechat-runtime-shared`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu`, `plugin-sdk/feishu-conversation`, `plugin-sdk/feishu-setup`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/telegram-command-ui`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` | Застарілі seams сумісності/допоміжних засобів bundled channel. Нові плагіни мають імпортувати універсальні підшляхи SDK або локальні barrel-модулі плагіна. |
    | Допоміжні засоби auth/специфічні для плагіна | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/memory-core`, `plugin-sdk/memory-lancedb`, `plugin-sdk/opencode`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Допоміжні seams для bundled feature/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
