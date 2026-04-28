---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розміщені, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-28T00:34:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6ad6676f134169657efbd160ec57018090b02325ea95262f493ccb1d2648d5b
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK представлено як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці каталогізовано найуживаніші підшляхи, згруповані за призначенням. Згенерований повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`; зарезервовані допоміжні підшляхи bundled-plugin також там відображаються, але є деталями реалізації, якщо тільки сторінка документації явно не рекомендує їх.

  Посібник з розробки Plugin див. у [Огляд Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Підшлях                             | Ключові експорти                                                                                                                                       |
  | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `plugin-sdk/plugin-entry`           | `definePluginEntry`                                                                                                                                    |
  | `plugin-sdk/core`                   | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                |
  | `plugin-sdk/config-schema`          | `OpenClawSchema`                                                                                                                                       |
  | `plugin-sdk/provider-entry`         | `defineSingleProviderPluginEntry`                                                                                                                      |
  | `plugin-sdk/testing`                | Загальнодоступні тестові фікстури Plugin, допоміжні засоби реєстрації/каталогу провайдерів, хуки контрактів майстра та допоміжні засоби підтримки контрактів bundled-plugin |
  | `plugin-sdk/plugin-test-api`        | Мінімальний побудовник моків `OpenClawPluginApi` для модульних тестів прямої реєстрації Plugin                                                        |
  | `plugin-sdk/channel-test-helpers`   | Допоміжні засоби тестування життєвого циклу облікових записів каналу, каталогів, send-config, моків runtime і хуків                                  |
  | `plugin-sdk/plugin-test-contracts`  | Допоміжні засоби контрактів для реєстрації Plugin, маніфесту пакета, публічного артефакту, runtime API, побічних ефектів імпорту та прямого імпорту |
  | `plugin-sdk/plugin-test-runtime`    | Фікстури Plugin runtime, реєстру, реєстрації провайдерів, setup-wizard і runtime TaskFlow для тестів                                                 |
  | `plugin-sdk/provider-test-contracts` | Допоміжні засоби контрактів для runtime провайдерів, автентифікації, виявлення, онбордингу, каталогу, web-search/fetch і майстра                    |
  | `plugin-sdk/test-env`               | Фікстури середовища тестування, fetch/мережі, live-test, тимчасової файлової системи й керування часом                                               |
  | `plugin-sdk/test-fixtures`          | Загальні тестові фікстури для CLI, sandbox, skill, повідомлень агента, системних подій, термінала, розбиття на чанки, auth-token і типізованих кейсів |
  | `plugin-sdk/migration`              | Допоміжні засоби елементів провайдера міграції, такі як `createMigrationItem`, константи причин, маркери статусу елементів, засоби редагування й `summarizeMigrationItems` |
  | `plugin-sdk/migration-runtime`      | Допоміжні засоби runtime міграції, такі як `copyMigrationFileItem` і `writeMigrationReport`                                                           |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби setup wizard, запити allowlist, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби для конфігурації/шлюзу дій багатьох облікових записів і резервного використання типового облікового запису |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації ідентифікаторів облікових записів |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису та резервного використання типового значення |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для списку облікових записів/дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу та універсальний побудовник |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілі схеми конфігурації bundled-channel лише для сумісності з bundled |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із резервною сумісністю bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні засоби життєвого циклу/фіналізації чернеткового потоку |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби маршрутизації вхідних повідомлень і побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису й диспетчеризації вхідних відповідей |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-send-deps` | Полегшений пошук залежностей надсилання вихідних повідомлень для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби доставки вихідних повідомлень, ідентичності, делегування надсилання, сесії, форматування й планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу прив’язок потоків і адаптерів |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби прив’язки розмов/потоків, pairing і налаштованих прив’язок |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб знімка конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби визначення групової політики runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби знімка/підсумку статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти Plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби рішень щодо групового доступу |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби автентифікації/захисту прямих DM |
    | `plugin-sdk/interactive-runtime` | Допоміжні засоби семантичного подання повідомлень, доставки та застарілих інтерактивних відповідей. Див. [Подання повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Сумісний barrel для debounce вхідних повідомлень, зіставлення згадок, допоміжних засобів політики згадок і envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби debounce вхідних повідомлень |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби політики згадок, маркерів згадок і тексту згадок без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби форматування inbound envelope |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту й форматування розташування каналу |
    | `plugin-sdk/channel-logging` | Допоміжні засоби журналювання каналу для відкинутих вхідних повідомлень і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби дій із повідомленнями каналу, а також застарілі допоміжні засоби нативних схем, збережені для сумісності Plugin |
    | `plugin-sdk/channel-route` | Спільні допоміжні засоби нормалізації маршрутів, визначення цілей на основі парсера, перетворення thread-id у рядок, dedupe/compact ключів маршрутів, типів parsed-target і порівняння маршрутів/цілей |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору цілей; виклики порівняння маршрутів мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналів |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-contract, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделей runtime |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад runtime LM Studio для типових значень локального сервера, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Типові значення бекенда CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API-ключів у runtime для Plugins провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/запису профілю API-ключа, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату автентифікації OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні інтерактивні допоміжні засоби входу для Plugins провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку змінних середовища для автентифікації провайдерів |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політик replay, допоміжні засоби кінцевих точок провайдерів і допоміжні засоби нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Хук runtime каталогу провайдерів і шви реєстру plugin-provider для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби HTTP/можливостей кінцевих точок провайдерів, помилки HTTP провайдерів і допоміжні засоби multipart form для транскрибування аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контрактів config/selection для web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешу провайдерів web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби config/credentials для web-search для провайдерів, яким не потрібне вбудування увімкнення Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контрактів config/credentials для web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і setter/getter для credentials з обмеженою областю дії |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешу/runtime провайдерів web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика та допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку та спільні допоміжні засоби обгорток для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Нативні допоміжні засоби транспорту провайдера, такі як guarded fetch, трансформації транспортних повідомлень і потоки подій транспорту з можливістю запису |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби патчів конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації груп і розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, включно з форматуванням меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення схвалювача й автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Нативні допоміжні засоби профілю/фільтра схвалення exec |
    | `plugin-sdk/approval-delivery-runtime` | Нативні адаптери можливостей/доставки схвалень |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб визначення approval Gateway |
    | `plugin-sdk/approval-handler-adapter-runtime` | Полегшені нативні допоміжні засоби завантаження адаптера схвалення для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби runtime обробника схвалень; віддавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Нативні допоміжні засоби цілей схвалення + прив’язки облікових записів |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді для схвалення exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload для схвалення exec/plugin, нативні допоміжні засоби маршрутизації/runtime схвалень і структуровані допоміжні засоби відображення схвалень, такі як `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контрактів каналів без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і нативні допоміжні засоби session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Полегшені предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Допоміжні засоби нормалізації тіла команд і поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь секретів channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, шлюзування DM, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів у сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби allowlist хостів і політики SSRF для приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої поверхні infra runtime |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, fetch із захистом від SSRF, помилка SSRF і допоміжні засоби політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів/цілей Webhook і приведення raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру тіла запиту/тайм-ауту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби для runtime/логування/резервного копіювання/встановлення Plugins |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби для змінних середовища runtime, логера, тайм-аутів, повторних спроб і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових значень, розбору URL CDP і допоміжних засобів автентифікації browser-control |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні засоби реєстрації та пошуку channel runtime-context |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/хуків/http/інтерактивної взаємодії Plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби pipeline для Webhook/внутрішніх хуків |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого імпорту/прив’язування runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версій, виклику аргументів і лінивих груп команд |
    | `plugin-sdk/gateway-runtime` | Допоміжні засоби клієнта Gateway, Gateway CLI RPC, помилок протоколу Gateway і патчів статусу каналу |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише з типами для форм конфігурації Plugin, таких як `OpenClawConfig` і типи конфігурації каналу/провайдера |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку конфігурації Plugin у runtime, такі як `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної мутації конфігурації, такі як `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка поточної конфігурації процесу, такі як `getRuntimeConfig`, `getRuntimeConfigSnapshot` і сетери тестових знімків |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли поверхня контракту bundled Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на посилання файлів без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби схвалення exec/plugin, побудовники можливостей схвалення, допоміжні засоби auth/profile, нативні допоміжні засоби маршрутизації/runtime і структуроване форматування шляху відображення схвалення |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби runtime для inbound/reply, розбиття на чанки, диспетчеризації, Heartbeat, планувальника відповіді |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби диспетчеризації/фіналізації відповіді та ярликів розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби коротковіконної історії відповідей і маркери, такі як `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби розбиття тексту/Markdown на чанки |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби для шляху сховища сесій, ключа сесії, updated-at і мутації сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби для шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів до каталогів state/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби маршрутів/ключів сесій/прив’язки облікових записів, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби підсумків статусу каналу/облікового запису, типових значень runtime-state і метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби визначення цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Видобування рядкових URL з вхідних даних, подібних до fetch/request |
    | `plugin-sdk/run-command` | Таймований виконавець команд із нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені зчитувачі параметрів інструментів/CLI |
    | `plugin-sdk/tool-payload` | Видобування нормалізованих payload з об’єктів результатів інструментів |
    | `plugin-sdk/tool-send` | Видобування канонічних полів цілі надсилання з аргументів інструмента |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів для тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні засоби логера підсистеми та редагування |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму таблиць Markdown і перетворення |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення моделі/сесії, такі як `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби визначення конфігурації провайдера talk |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні засоби повторно вхідного блокування файлів |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу дедуплікації на диску |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби runtime/сесій ACP і диспетчеризації відповідей |
    | `plugin-sdk/acp-binding-resolve-runtime` | Визначення прив’язки ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Нестрогий зчитувач булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби визначення збігів небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та токенів прив’язки |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, статусу й ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповідей команд/провайдерів `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби виведення списку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/побудови/серіалізації нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агента: типи harness, допоміжні засоби steer/abort активного запуску, допоміжні засоби мосту інструментів OpenClaw, допоміжні засоби політик інструментів runtime-plan, класифікація результатів термінала, допоміжні засоби форматування/деталізації прогресу інструментів і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення кінцевих точок Z.A.I |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб process-local async lock для невеликих файлів стану runtime |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеженої конкурентності асинхронних задач |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби кешу дедуплікації в пам’яті |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб зливу черги очікуваної вихідної доставки |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів до локальних файлів і джерел медіа |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби подій і видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Допоміжний засіб приведення числових значень |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних токенів/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте наведені вище сфокусовані підшляхи runtime |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичних прапорців, подій і trace-context |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Зчитувач обмеженого тіла відповіді без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки розмови без маршрутизації налаштованих прив’язок або сховищ pairing |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту та фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення та нормалізації примітивних записів/рядків без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації імен хостів і хостів SCP |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації повторних спроб і виконавця повторних спроб |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогів/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/dedup каталогу на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби fetch/transform/store для медіа, а також побудовники payload медіа |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби сховища медіа, такі як `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover для генерації медіа, вибір кандидатів і повідомлення про відсутні моделі |
    | `plugin-sdk/media-understanding` | Типи провайдерів для розуміння медіа, а також експорти допоміжних засобів для зображень/аудіо, орієнтованих на провайдерів |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби для тексту/Markdown/логування, такі як видалення видимого для асистента тексту, допоміжні засоби рендерингу/розбиття на чанки/таблиць Markdown, засоби редагування, допоміжні засоби тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб розбиття вихідного тексту на чанки |
    | `plugin-sdk/speech` | Типи провайдерів мовлення, а також експорти директив, реєстру, валідації та допоміжних засобів мовлення, орієнтовані на провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи провайдерів мовлення, експорти реєстру, директив, нормалізації та допоміжних засобів мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрибування в реальному часі, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, допоміжні засоби failover, auth і реєстру |
    | `plugin-sdk/music-generation` | Типи провайдерів/запитів/результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби failover, пошук провайдера та розбір model-ref |
    | `plugin-sdk/video-generation` | Типи провайдерів/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби failover, пошук провайдера та розбір model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні засоби реєстру цілей Webhook і встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляхів Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів plugin SDK |
    | `plugin-sdk/testing` | Загальнодоступні допоміжні засоби тестування extension, зокрема моки реєстру/runtime Plugin, захоплення реєстрації провайдерів, допоміжні засоби setup-wizard, фікстури fetch/env/temp/time, допоміжні засоби schema/media/live-test, `installCommonResolveTargetErrorCases`, `writeSkill`, `createTestRegistry` і завантаження env для live generation. Допоміжні засоби extension `*.test-support.ts` мають залишатися тут або на сфокусованих підшляхах SDK, а не у внутрішніх модулях core |
    | `plugin-sdk/plugin-test-api` | Мінімальний допоміжний засіб `createTestPluginApi` для модульних тестів прямої реєстрації Plugin без імпорту мостів допоміжних засобів тестування репозиторію |
    | `plugin-sdk/channel-test-helpers` | Орієнтовані на канали допоміжні засоби тестування життєвого циклу запуску облікових записів, перевірок каталогів, потоковості send-config, моків runtime, проблем статусу, вихідної доставки та реєстрації хуків |
    | `plugin-sdk/plugin-test-contracts` | Допоміжні засоби контрактів пакета Plugin, реєстрації, публічного артефакту, прямого імпорту, runtime API і побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Допоміжні засоби контрактів runtime провайдера, auth, discovery, onboard, catalog, wizard, web-search/fetch і stream |
    | `plugin-sdk/test-fixtures` | Загальні фікстури захоплення runtime CLI, контексту sandbox, записувача skill, agent-message, system-event, terminal-text, chunking, auth-token і типізованих кейсів |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для менеджера/конфігурації/файлів/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти ембедингів хоста пам’яті, доступ до реєстру, локальний провайдер і загальні допоміжні засоби пакетної/віддаленої обробки |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти engine QMD хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Допоміжні засоби мультимодального хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби runtime CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний до постачальника псевдонім для допоміжних засобів core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний до постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний до постачальника псевдонім для допоміжних засобів файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби керованого Markdown для Plugins, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний до постачальника псевдонім для допоміжних засобів статусу хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Сімейство | Поточні підшляхи | Призначене використання |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки bundled browser Plugin. `browser-profiles` експортує `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` і `ResolvedBrowserTabCleanupConfig` для нормалізованої форми `browser.tabCleanup`. `browser-support` залишається barrel сумісності. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних засобів/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних засобів/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних засобів bundled IRC |
    | Допоміжні засоби для конкретних каналів | `plugin-sdk/googlechat`, `plugin-sdk/googlechat-runtime-shared`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu`, `plugin-sdk/feishu-conversation`, `plugin-sdk/feishu-setup`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/telegram-command-ui`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` | Застарілі шви сумісності/допоміжні шви bundled channel. Нові Plugins мають імпортувати загальні підшляхи SDK або локальні barrel Plugin. |
    | Допоміжні засоби auth/специфічні для Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/memory-core`, `plugin-sdk/memory-lancedb`, `plugin-sdk/opencode`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Допоміжні шви функцій/Plugins bundled; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugins](/uk/plugins/building-plugins)
