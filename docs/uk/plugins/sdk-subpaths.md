---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де знаходяться, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-28T03:27:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: de57f861811bd71a2bad5a80a50c243bc17064e39c0d3addf40e2bd9fa490243
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  SDK Plugin доступний як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  Ця сторінка містить каталог поширених підшляхів, згрупованих за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також там вказані, але є деталлю
  реалізації, якщо лише сторінка документації явно не просуває їх. Супровідники можуть перевіряти активні
  та неактивні зарезервовані допоміжні підшляхи за допомогою `pnpm plugins:boundary-report:summary`.

  Посібник зі створення Plugin див. у [Огляд SDK Plugin](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Підшлях | Ключові експорти |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Широкий сумісний barrel для застарілих тестів Plugin; для нових тестів розширень віддавайте перевагу цільовим тестовим підшляхам                                           |
  | `plugin-sdk/plugin-test-api`              | Мінімальний конструктор моків `OpenClawPluginApi` для прямих модульних тестів реєстрації Plugin                                                                              |
  | `plugin-sdk/agent-runtime-test-contracts` | Фікстури контрактів власного адаптера agent-runtime для профілів автентифікації, придушення доставки, класифікації fallback, хуків інструментів, накладень prompt, схем і відновлення транскрипту |
  | `plugin-sdk/channel-test-helpers`         | Допоміжні засоби тестування життєвого циклу облікового запису каналу, каталогу, send-config, мока runtime, hook, bundled entry каналу, часової мітки envelope, відповіді pairing і загального контракту каналу   |
  | `plugin-sdk/channel-target-testing`       | Спільний набір тестів випадків помилок для розв’язання цілей каналу                                                                                                          |
  | `plugin-sdk/plugin-test-contracts`        | Допоміжні засоби контрактів для реєстрації Plugin, маніфесту пакета, публічного артефакту, runtime API, побічних ефектів імпорту та прямого імпорту                         |
  | `plugin-sdk/plugin-test-runtime`          | Фікстури runtime Plugin, реєстру, реєстрації провайдера, майстра налаштування та runtime TaskFlow для тестів                                                                |
  | `plugin-sdk/provider-test-contracts`      | Допоміжні засоби контрактів для runtime провайдера, автентифікації, виявлення, onboard, каталогу, можливостей медіа, політики replay, live-audio realtime STT, web-search/fetch і майстра                 |
  | `plugin-sdk/provider-http-test-mocks`     | Опційні Vitest HTTP/моки автентифікації для тестів провайдера, які використовують `plugin-sdk/provider-http`                                                                |
  | `plugin-sdk/test-env`                     | Фікстури тестового середовища, fetch/мережі, disposable HTTP-сервера, вхідного запиту, live-тесту, тимчасової файлової системи та керування часом                          |
  | `plugin-sdk/test-fixtures`                | Загальні тестові фікстури CLI, sandbox, skill, agent-message, system-event, перезавантаження модуля, шляху bundled Plugin, terminal, chunking, auth-token і typed-case      |
  | `plugin-sdk/test-node-mocks`              | Цільові допоміжні засоби моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")`                                                         |
  | `plugin-sdk/migration`                    | Допоміжні засоби елементів провайдера міграції, як-от `createMigrationItem`, константи причин, маркери статусу елементів, засоби редагування чутливих даних і `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Допоміжні засоби runtime міграції, як-от `copyMigrationFileItem` і `writeMigrationReport`                                                                                    |

  <AccordionGroup>
  <Accordion title="Підшляхи каналу">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Кореневий експорт Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, prompt із allowlist, конструктори статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби для багатoоблікового config/action-gate і fallback до облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису + fallback до значення за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для списку облікових записів/дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу та універсальний конструктор |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації bundled каналів OpenClaw лише для підтримуваних bundled Plugin |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий сумісний псевдонім для bundled схем конфігурації каналу |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із fallback до bundled-контракту |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні засоби життєвого циклу/фіналізації чернеткового потоку |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби маршруту вхідних даних + конструктора envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису та диспетчеризації вхідних відповідей |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби парсингу/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-send-deps` | Полегшений пошук залежностей вихідного надсилання для адаптерів каналу |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідної доставки, ідентифікації, делегата надсилання, сесії, форматування та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу прив’язок потоків і адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий конструктор payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби прив’язки розмови/потоку, pairing і налаштованих прив’язок |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб знімка config runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби розв’язання групової політики runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби знімка/підсумку статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису config каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти Plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання config allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби рішень щодо доступу групи |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби автентифікації/захисту direct-DM |
    | `plugin-sdk/interactive-runtime` | Семантичні допоміжні засоби представлення повідомлень, доставки та застарілих інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Сумісний barrel для debounce вхідних даних, зіставлення згадок, допоміжних засобів політики згадок і допоміжних засобів envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби debounce вхідних даних |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби політики згадок, маркерів згадок і тексту згадок без ширшої поверхні runtime вхідних даних |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби форматування вхідного envelope |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту та форматування розташування каналу |
    | `plugin-sdk/channel-logging` | Допоміжні засоби логування каналу для відкидання вхідних даних і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби дій над повідомленнями каналу, а також застарілі допоміжні засоби нативних схем, збережені для сумісності Plugin |
    | `plugin-sdk/channel-route` | Спільні допоміжні засоби нормалізації маршруту, розв’язання цілей на основі парсера, перетворення thread-id на рядок, dedupe/compact ключів маршруту, типів parsed-target і порівняння маршруту/цілі |
    | `plugin-sdk/channel-targets` | Допоміжні засоби парсингу цілей; викликачам порівняння маршрутів слід використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-контракту, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи secret target |
  </Accordion>

  <Accordion title="Підшляхи провайдера">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделі runtime |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад runtime LM Studio для локальних типових значень сервера, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локального/self-hosted провайдера |
    | `plugin-sdk/self-hosted-provider-setup` | Цільові допоміжні засоби налаштування self-hosted провайдера, сумісного з OpenAI |
    | `plugin-sdk/cli-backend` | Типові значення бекенда CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби розв’язання API-ключа runtime для Plugin провайдера |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби onboarding/запису профілю API-ключа, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор auth-result OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для Plugin провайдера |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env var для автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори replay-policy, допоміжні засоби endpoint провайдера та допоміжні засоби нормалізації model-id, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Хук runtime для розширення каталогу провайдера та межі реєстру plugin-provider для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби HTTP/можливостей endpoint провайдера, помилки HTTP провайдера та допоміжні засоби multipart form для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту config/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби config/облікових даних web-search для провайдерів, яким не потрібне підключення увімкнення Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту config/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped-сетери/гетери облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні допоміжні засоби wrapper для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Власні допоміжні засоби транспорту провайдера, як-от guarded fetch, перетворення транспортних повідомлень і потоки подій writable transport |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби patch конфігурації onboarding |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації групи та парсингу команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, включно з форматуванням меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Конструктори повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби розв’язання approver і авторизації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Власні допоміжні засоби профілю/фільтра схвалення exec |
    | `plugin-sdk/approval-delivery-runtime` | Власні адаптери можливостей/доставки схвалення |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб розв’язання Gateway схвалення |
    | `plugin-sdk/approval-handler-adapter-runtime` | Полегшені власні допоміжні засоби завантаження адаптера схвалення для гарячих точок входу каналу |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби runtime обробника схвалення; віддавайте перевагу вужчим межам adapter/gateway, якщо їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Власні допоміжні засоби цілі схвалення + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді на схвалення exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload схвалення exec/plugin, власні допоміжні засоби маршрутизації/runtime схвалення та структуровані допоміжні засоби відображення схвалення, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання dedupe вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контракту каналу без широкого тестового barrel |
    | `plugin-sdk/command-auth-native` | Власна автентифікація команд, форматування меню динамічних аргументів і власні допоміжні засоби session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Полегшені предикати тексту команд для гарячих шляхів каналу |
    | `plugin-sdk/command-surface` | Допоміжні засоби нормалізації тіла команди та поверхні команди |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-контракту для поверхонь secret каналу/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для парсингу secret-контракту/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, DM gating, зовнішнього вмісту, редагування чутливого тексту, порівняння secret у сталий час і збирання secret |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби allowlist хостів і політики SSRF для приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої infra-поверхні runtime |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, fetch із захистом SSRF, помилки SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби парсингу secret input |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запиту/цілі Webhook і приведення raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру body/timeout запиту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/логування/резервного копіювання/встановлення Plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби env runtime, logger, timeout, retry і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових значень, парсингу URL CDP і допоміжних засобів автентифікації browser-control |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні засоби реєстрації та пошуку runtime-context каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/хуків/http/інтерактивної взаємодії Plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби конвеєра Webhook/внутрішніх hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого імпорту/прив’язування runtime, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби exec процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версій, виклику аргументів і лінивих груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, CLI RPC Gateway, помилки протоколу Gateway і допоміжні засоби patch статусу каналу |
    | `plugin-sdk/config-types` | Поверхня config лише для типів для форм конфігурації Plugin, як-от `OpenClawConfig` і типи конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку config Plugin у runtime, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної мутації config, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка config поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot` і сетери тестових знімків |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли bundled поверхня контракту Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби схвалення exec/plugin, конструктори можливостей схвалення, допоміжні засоби auth/профілів, власні допоміжні засоби маршрутизації/runtime і форматування структурованого шляху відображення схвалення |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби runtime для вхідних даних/відповідей, chunking, dispatch, Heartbeat, планувальник відповіді |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize відповіді та ярликів розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби короткого вікна історії відповідей і маркери, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/Markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сесій, ключа сесії, updated-at і мутації сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів до каталогів стану/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби маршруту/ключа сесії/прив’язки облікового запису, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби підсумку статусу каналу/облікового запису, типові значення стану runtime і допоміжні засоби метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби розв’язання цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL із fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Виконавець команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені читачі параметрів інструментів/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об’єктів результатів інструментів |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів інструмента |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляху тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні засоби logger підсистеми та редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму та перетворення таблиць Markdown |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення моделі/сесії, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби розв’язання конфігурації провайдера Talk |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні засоби повторно вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу dedupe з резервним збереженням на диск |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби runtime/сесії ACP і dispatch відповідей |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання прив’язки ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Читач нестрогих булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби розв’язання зіставлення небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, статусу й ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді провайдера/команди `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби переліку команд skill |
    | `plugin-sdk/native-command-registry` | Власні допоміжні засоби реєстру/побудови/серіалізації команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агента: типи harness, допоміжні засоби керування/переривання активного запуску, допоміжні засоби мосту інструментів OpenClaw, допоміжні засоби політики інструментів runtime-plan, класифікація результатів terminal, а також допоміжні засоби форматування/деталізації прогресу інструментів і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.A.I |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб process-local async lock для невеликих файлів стану runtime |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеженої конкурентності асинхронних завдань |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби кешу dedupe в пам’яті |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб дренування черги вихідної доставки, що очікує |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів до локальних файлів і джерел медіа |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби подій і видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Допоміжний засіб числового приведення |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних токенів/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте наведені вище цільові підшляхи runtime |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби прапорців, подій і trace-context діагностики |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Читач обмеженого тіла відповіді без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки розмови без маршрутизації налаштованих прив’язок або сховищ pairing |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких імпортів запису/обслуговування config |
    | `plugin-sdk/context-visibility-runtime` | Допоміжні засоби розв’язання видимості контексту та фільтрації додаткового контексту без широких імпортів config/безпеки |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення та нормалізації примітивних record/рядків без імпортів markdown/логування |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і хостів SCP |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і виконавця retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогу/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/dedup каталогу з резервним збереженням у config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби fetch/transform/store для медіа, а також конструктори media payload |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби сховища медіа, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover генерації медіа, вибору кандидатів і повідомлень про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдера розуміння медіа, а також орієнтовані на провайдера експорти допоміжних засобів для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби тексту/Markdown/логування, як-от видалення тексту, видимого помічнику, допоміжні засоби рендерингу/chunking/таблиць Markdown, допоміжні засоби редагування чутливих даних, допоміжні засоби тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдера мовлення, а також орієнтовані на провайдера експорти директив, реєстру, валідації, конструктора TTS, сумісного з OpenAI, і допоміжних засобів мовлення |
    | `plugin-sdk/speech-core` | Спільні типи провайдера мовлення, експорти реєстру, директив, нормалізації та допоміжних засобів мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдера транскрипції в реальному часі, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдера голосу в реальному часі та допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи провайдера генерації зображень, а також допоміжні засоби asset/data URL зображень і конструктор провайдера зображень, сумісного з OpenAI |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, допоміжні засоби failover, автентифікації та реєстру |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби failover, пошуку провайдера та парсингу model-ref |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби failover, пошуку провайдера та парсингу model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні засоби реєстру цілей Webhook і встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів SDK Plugin |
    | `plugin-sdk/testing` | Широкий сумісний barrel для застарілих тестів Plugin. Нові тести розширень мають імпортувати натомість цільові підшляхи SDK, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний допоміжний засіб `createTestPluginApi` для прямих модульних тестів реєстрації Plugin без імпорту мостів допоміжних засобів тестування репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Фікстури контрактів власного адаптера agent-runtime для тестів автентифікації, доставки, fallback, tool-hook, prompt-overlay, схем і проєкції транскрипту |
    | `plugin-sdk/channel-test-helpers` | Орієнтовані на канал допоміжні засоби тестування для загальних контрактів дій/налаштування/статусу, перевірок каталогу, життєвого циклу запуску облікового запису, threading send-config, моків runtime, проблем статусу, вихідної доставки та реєстрації hook |
    | `plugin-sdk/channel-target-testing` | Спільний набір випадків помилок розв’язання цілей для тестів каналу |
    | `plugin-sdk/plugin-test-contracts` | Допоміжні засоби контрактів пакета Plugin, реєстрації, публічного артефакту, прямого імпорту, runtime API та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Допоміжні засоби контрактів runtime провайдера, автентифікації, виявлення, onboard, каталогу, майстра, можливостей медіа, політики replay, live-audio realtime STT, web-search/fetch і stream |
    | `plugin-sdk/provider-http-test-mocks` | Опційні Vitest HTTP/моки автентифікації для тестів провайдера, які використовують `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Загальні фікстури захоплення runtime CLI, контексту sandbox, записувача skill, agent-message, system-event, перезавантаження модуля, шляху bundled Plugin, terminal-text, chunking, auth-token і typed-case |
    | `plugin-sdk/test-node-mocks` | Цільові допоміжні засоби моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для менеджера/config/файла/допоміжних засобів CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний провайдер і загальні допоміжні засоби batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Допоміжні засоби multimodal хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби secret хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби runtime CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний до постачальника псевдонім для допоміжних засобів core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний до постачальника псевдонім для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний до постачальника псевдонім для допоміжних засобів файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби керованого Markdown для Plugin, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до менеджера пошуку |
    | `plugin-sdk/memory-host-status` | Нейтральний до постачальника псевдонім для допоміжних засобів статусу хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Сімейство | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки bundled browser Plugin. `browser-profiles` експортує `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` і `ResolvedBrowserTabCleanupConfig` для нормалізованої форми `browser.tabCleanup`. `browser-support` залишається barrel сумісності. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних засобів/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних засобів/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних засобів bundled IRC |
    | Допоміжні засоби, специфічні для каналу | `plugin-sdk/googlechat`, `plugin-sdk/googlechat-runtime-shared`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu`, `plugin-sdk/feishu-conversation`, `plugin-sdk/feishu-setup`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/telegram-command-ui`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` | Застарілі межі сумісності/допоміжних засобів bundled каналів. Нові Plugin мають імпортувати загальні підшляхи SDK або локальні для Plugin barrel. |
    | Допоміжні засоби, специфічні для auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/memory-core`, `plugin-sdk/memory-lancedb`, `plugin-sdk/opencode`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Межі допоміжних засобів bundled можливостей/Plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

- [Огляд SDK Plugin](/uk/plugins/sdk-overview)
- [Налаштування SDK Plugin](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
