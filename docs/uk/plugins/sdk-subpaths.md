---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту плагіна
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розміщені, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-28T02:07:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: c56a83c4cf89a40286328bd58079af21a1f5fcf2392c5f6a1e08f873c65e49d6
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK представлено як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено каталог найуживаніших підшляхів, згрупованих за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також наведено там, але вони є деталями
  реалізації, якщо тільки окрема сторінка документації явно не рекомендує їх.

  Посібник зі створення плагінів дивіться в [Огляд Plugin SDK](/uk/plugins/sdk-overview).

  ## Вхід плагіна

  | Підшлях                              | Основні експорти                                                                                                                                        |
  | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`            | `definePluginEntry`                                                                                                                                      |
  | `plugin-sdk/core`                    | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                   |
  | `plugin-sdk/config-schema`           | `OpenClawSchema`                                                                                                                                         |
  | `plugin-sdk/provider-entry`          | `defineSingleProviderPluginEntry`                                                                                                                        |
  | `plugin-sdk/testing`                 | Широкий сумісний barrel для застарілих тестів плагінів; для нових тестів розширень віддавайте перевагу цільовим тестовим підшляхам                     |
  | `plugin-sdk/plugin-test-api`         | Мінімальний побудовник моку `OpenClawPluginApi` для модульних тестів прямої реєстрації плагінів                                                        |
  | `plugin-sdk/channel-test-helpers`    | Допоміжні засоби для тестів життєвого циклу облікових записів каналу, каталогів, конфігурації надсилання, моку runtime, hook і загального контракту каналу |
  | `plugin-sdk/channel-target-testing`  | Спільний набір тестів для випадків помилок під час визначення цілі каналу                                                                               |
  | `plugin-sdk/plugin-test-contracts`   | Допоміжні засоби для контрактів реєстрації плагіна, маніфесту пакета, публічного артефакту, runtime API, побічних ефектів імпорту та прямого імпорту    |
  | `plugin-sdk/plugin-test-runtime`     | Фікстури для тестів runtime плагіна, реєстру, реєстрації провайдера, майстра налаштування та runtime TaskFlow                                          |
  | `plugin-sdk/provider-test-contracts` | Допоміжні засоби для контрактів runtime провайдера, автентифікації, виявлення, онбордингу, каталогу, мультимедійних можливостей, web-search/fetch і майстра |
  | `plugin-sdk/provider-http-test-mocks` | Опціональні моки HTTP/автентифікації Vitest для тестів провайдера, які використовують `plugin-sdk/provider-http`                                       |
  | `plugin-sdk/test-env`                | Фікстури середовища тестування, fetch/мережі, live-тестів, тимчасової файлової системи та керування часом                                              |
  | `plugin-sdk/test-fixtures`           | Загальні тестові фікстури CLI, sandbox, skill, повідомлень агента, системних подій, термінала, chunking, токенів автентифікації та типізованих випадків |
  | `plugin-sdk/migration`               | Допоміжні засоби для елементів провайдера міграції, такі як `createMigrationItem`, константи причин, маркери статусу елементів, засоби редагування та `summarizeMigrationItems` |
  | `plugin-sdk/migration-runtime`       | Допоміжні засоби для runtime міграції, такі як `copyMigrationFileItem` і `writeMigrationReport`                                                         |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, запити allowlist, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби для конфігурації/гейтів дій багатьох облікових записів і резервного використання облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації ідентифікатора облікового запису |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису + резервного використання облікового запису за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для списків облікових записів/дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу та загальний побудовник |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації каналів bundled OpenClaw лише для підтримуваних bundled-плагінів |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий псевдонім сумісності для bundled-схем конфігурації каналів |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із резервним bundled-контрактом |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби для шлюзування авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні засоби життєвого циклу/завершення чернеткових потоків |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби для побудови вхідних маршрутів і envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби для запису та диспетчеризації вхідних даних |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби для розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-send-deps` | Полегшений пошук залежностей вихідного надсилання для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідної доставки, ідентичності, делегата надсилання, сесії, форматування та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу thread-binding і адаптерів |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник мультимедійного payload агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби для binding розмов/потоків, pairing та налаштованих binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб знімка конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби визначення групової політики runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби знімка/підсумку стану каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти плагіна каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби рішень щодо групового доступу |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби автентифікації/захисту direct-DM |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі допоміжні засоби інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Сумісний barrel для debounce вхідних даних, зіставлення згадок, допоміжних засобів політики згадок і envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби debounce вхідних даних |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби політики згадок, маркерів згадок і тексту згадок без ширшої поверхні runtime вхідних даних |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби форматування вхідного envelope |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту та форматування розташування каналу |
    | `plugin-sdk/channel-logging` | Допоміжні засоби логування каналу для відкидання вхідних даних і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповідей |
    | `plugin-sdk/channel-actions` | Допоміжні засоби дій із повідомленнями каналу, а також застарілі допоміжні засоби нативної схеми, збережені для сумісності плагінів |
    | `plugin-sdk/channel-route` | Спільні допоміжні засоби нормалізації маршрутів, визначення цілей на основі парсера, перетворення thread-id у рядок, dedupe/compact ключів маршрутів, типів parsed-target і порівняння маршрутів/цілей |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору цілей; виклики порівняння маршрутів мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналів |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-контрактів, такі як `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret-цілей |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделей у runtime |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад runtime LM Studio для локальних серверних значень за замовчуванням, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні засоби налаштування self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Значення за замовчуванням для бекенду CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API-ключа в runtime для плагінів провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу API-ключа/запису профілю, такі як `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату OAuth-автентифікації |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для плагінів провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку змінних середовища автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники політик replay, допоміжні засоби endpoint провайдерів і нормалізації model-id, такі як `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime для розширення каталогу провайдерів і seams реєстру plugin-provider для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби HTTP/можливостей endpoint провайдера, HTTP-помилки провайдера та допоміжні засоби multipart form для транскрибування аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, такі як `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення увімкнення плагіна |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, такі як `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також scoped-сетери/гетери облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та допоміжні засоби сумісності xAI, такі як `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні допоміжні засоби wrapper для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспорту провайдера, такі як guarded fetch, трансформації transport message і доступні для запису потоки transport event |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби патчингу конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації групи та розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, включно з форматуванням меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, такі як `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення затверджувача та автентифікації дій у межах того самого чату |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра нативного exec approval |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери можливостей/доставки нативного approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб визначення gateway approval |
    | `plugin-sdk/approval-handler-adapter-runtime` | Полегшені допоміжні засоби завантаження адаптера нативного approval handler для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби runtime для approval handler; віддавайте перевагу вужчим seams адаптера/gateway, якщо їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби цілі нативного approval + binding облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді exec/plugin approval |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload exec/plugin approval, допоміжні засоби маршрутизації/runtime нативного approval і допоміжні засоби структурованого відображення approval, такі як `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання dedupe для вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контрактів каналів без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і допоміжні засоби native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Полегшені предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Нормалізація тіла команди та допоміжні засоби command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-контрактів для поверхонь секретів каналів/плагінів |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору secret-контрактів/конфігурації |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, DM gating, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів у сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF для allowlist хостів і приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої поверхні infra runtime |
    | `plugin-sdk/ssrf-runtime` | pinned-dispatcher, fetch із захистом від SSRF, помилка SSRF і допоміжні засоби політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору секретного вводу |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запиту/цілі Webhook і приведення raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби для розміру тіла запиту/тайм-ауту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/logging/backup/встановлення плагінів |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби env runtime, logger, timeout, retry і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/значень за замовчуванням, розбору URL CDP і допоміжних засобів автентифікації browser-control |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні засоби реєстрації та пошуку runtime-context каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/hook/http/interactive плагіна |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби pipeline webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy імпорту/binding runtime, такі як `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби exec процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версій, виклику аргументів і lazy command-group |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, CLI RPC Gateway, помилки протоколу Gateway і допоміжні засоби patch стану каналу |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише для типів для форм конфігурації плагінів, таких як `OpenClawConfig`, і типів конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку конфігурації плагіна в runtime, такі як `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної мутації конфігурації, такі як `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка конфігурації поточного процесу, такі як `getRuntimeConfig`, `getRuntimeConfigSnapshot` і сетери тестового знімка |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли bundled-поверхня контракту Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби approval exec/plugin, побудовники можливостей approval, допоміжні засоби auth/profile, допоміжні засоби нативної маршрутизації/runtime і форматування шляхів структурованого відображення approval |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби runtime вхідних даних/відповідей, chunking, dispatch, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize відповідей і міток розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби та маркери історії відповідей короткого вікна, такі як `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/Markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сесій, ключа сесії, updated-at і мутації сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів каталогів стану/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби маршруту/ключа сесії/binding облікового запису, такі як `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби підсумку стану каналу/облікового запису, значень стану runtime за замовчуванням і метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби визначення цілі |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL із входів на кшталт fetch/request |
    | `plugin-sdk/run-command` | Виконавець команд із тайм-лімітом і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені читачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасових завантажень |
    | `plugin-sdk/logging-core` | Допоміжні засоби logger підсистеми та редагування |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму таблиць Markdown і перетворення |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення моделі/сесії, такі як `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби визначення конфігурації talk-провайдера |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Повторно вхідні допоміжні засоби file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу dedupe з дисковою підтримкою |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби runtime/сесії ACP і dispatch відповідей |
    | `plugin-sdk/acp-binding-resolve-runtime` | Визначення binding ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Читач параметрів логічних значень із м’яким приведенням |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби визначення збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповідей команди `/models`/провайдера |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби виведення списку команд skill |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/побудови/серіалізації нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агента: типи harness, допоміжні засоби steer/abort активного запуску, допоміжні засоби bridge tool OpenClaw, допоміжні засоби політики tool плану runtime, класифікація результатів terminal, допоміжні засоби форматування/деталізації прогресу tool і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб process-local async lock для невеликих файлів стану runtime |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеженої конкурентності async-задач |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби кешу dedupe в пам’яті |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб спорожнення черги очікуваної вихідної доставки |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів до локальних файлів і джерел медіа |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби подій і видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Допоміжний засіб числового приведення |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних токенів/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте наведені вище сфокусовані підшляхи runtime |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичних прапорців, подій і trace-context |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Читач обмеженого тіла відповіді без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан binding розмови без маршрутизації налаштованого binding або сховищ pairing |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту й фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення та нормалізації примітивних записів/рядків без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і хостів SCP |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і виконавця retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогу/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/усунення дублікатів каталогів із підтримкою конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби fetch/transform/store для медіа, а також побудовники media payload |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби сховища медіа, такі як `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover для генерації медіа, вибору кандидатів і повідомлень про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти допоміжних засобів для зображень/аудіо, орієнтованих на провайдерів |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби text/markdown/logging, такі як вилучення видимого асистенту тексту, допоміжні засоби рендерингу/chunking/таблиць Markdown, допоміжні засоби редагування, допоміжні засоби тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдерів мовлення, а також експорти директив, реєстру, валідації, сумісного з OpenAI побудовника TTS і допоміжних засобів мовлення, орієнтованих на провайдерів |
    | `plugin-sdk/speech-core` | Спільні експорти типів провайдерів мовлення, реєстру, директив, нормалізації та допоміжних засобів мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень, а також допоміжні засоби ресурсів зображень/data URL |
    | `plugin-sdk/image-generation-core` | Спільні допоміжні засоби типів, failover, auth і реєстру генерації зображень |
    | `plugin-sdk/music-generation` | Типи провайдерів/запитів/результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні допоміжні засоби типів, failover, пошуку провайдера та розбору model-ref для генерації музики |
    | `plugin-sdk/video-generation` | Типи провайдерів/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні допоміжні засоби типів, failover, пошуку провайдера та розбору model-ref для генерації відео |
    | `plugin-sdk/webhook-targets` | Допоміжні засоби реєстру цілей Webhook і встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | Широкий сумісний barrel для застарілих тестів плагінів. Нові тести розширень мають натомість імпортувати сфокусовані підшляхи SDK, такі як `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний допоміжний засіб `createTestPluginApi` для модульних тестів прямої реєстрації плагінів без імпорту bridge допоміжних засобів тестування репозиторію |
    | `plugin-sdk/channel-test-helpers` | Допоміжні засоби тестування, орієнтовані на канали, для загальних контрактів дій/налаштування/стану, перевірок каталогів, життєвого циклу запуску облікового запису, thread-ing конфігурації надсилання, моків runtime, проблем стану, вихідної доставки та реєстрації hook |
    | `plugin-sdk/channel-target-testing` | Спільний набір перевірок випадків помилок визначення цілі для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Допоміжні засоби контрактів пакета плагіна, реєстрації, публічного артефакту, прямого імпорту, runtime API та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Допоміжні засоби контрактів runtime провайдера, auth, discovery, onboard, каталогу, майстра, мультимедійних можливостей, web-search/fetch і stream |
    | `plugin-sdk/provider-http-test-mocks` | Опціональні моки HTTP/auth для Vitest для тестів провайдера, які використовують `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Загальні фікстури захоплення runtime CLI, контексту sandbox, writer для Skills, повідомлень агента, системних подій, тексту термінала, chunking, auth-token і типізованих випадків |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для manager/config/file/CLI helpers |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексації/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний провайдер і загальні batch/remote helper-и |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби стану хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби runtime CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний до постачальника псевдонім для допоміжних засобів core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний до постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний до постачальника псевдонім для допоміжних засобів файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби керованого Markdown для плагінів, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний до постачальника псевдонім для допоміжних засобів стану хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Сімейство | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки bundled browser plugin. `browser-profiles` експортує `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` і `ResolvedBrowserTabCleanupConfig` для нормалізованої форми `browser.tabCleanup`. `browser-support` залишається barrel сумісності. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних засобів/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних засобів/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних засобів bundled IRC |
    | Допоміжні засоби, специфічні для каналів | `plugin-sdk/googlechat`, `plugin-sdk/googlechat-runtime-shared`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu`, `plugin-sdk/feishu-conversation`, `plugin-sdk/feishu-setup`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/telegram-command-ui`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` | Застарілі seams сумісності/допоміжних засобів bundled channel. Нові плагіни мають імпортувати загальні підшляхи SDK або локальні barrel-и плагіна. |
    | Допоміжні засоби, специфічні для auth/плагінів | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/memory-core`, `plugin-sdk/memory-lancedb`, `plugin-sdk/opencode`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Допоміжні seams bundled feature/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
