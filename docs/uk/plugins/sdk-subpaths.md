---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розміщені, згруповані за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-28T02:44:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c4eab29c94c207a616599216655448dd33ab9e07be1a5391cd5fec63c07d93d
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK надається як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці зібрано найуживаніші підшляхи, згруповані за призначенням. Згенерований
  повний список із понад 200 підшляхів розміщено в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також там наведені, але є деталлю
  реалізації, якщо лише сторінка документації явно не просуває їх.

  Посібник з авторства Plugin див. у [Огляд Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Subpath                                   | Ключові експорти                                                                                                                                                             |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                      |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Широкий сумісний barrel для застарілих тестів Plugin; для нових тестів extension віддавайте перевагу цільовим тестовим підшляхам                                           |
  | `plugin-sdk/plugin-test-api`              | Мінімальний конструктор мока `OpenClawPluginApi` для прямих модульних тестів реєстрації Plugin                                                                              |
  | `plugin-sdk/agent-runtime-test-contracts` | Фікстури контрактів нативного адаптера agent-runtime для профілів автентифікації, пригнічення доставки, класифікації fallback, хуків інструментів, накладок prompt, схем і відновлення транскрипту |
  | `plugin-sdk/channel-test-helpers`         | Допоміжні засоби для життєвого циклу облікового запису каналу, каталогу, send-config, мока runtime, hook, bundled channel entry, часової мітки envelope, відповіді pairing і тестів загального контракту каналу |
  | `plugin-sdk/channel-target-testing`       | Спільний набір тестів випадків помилок розв’язання цілей каналу                                                                                                             |
  | `plugin-sdk/plugin-test-contracts`        | Допоміжні засоби контрактів реєстрації Plugin, маніфесту пакета, публічного артефакту, runtime API, побічних ефектів імпорту та прямого імпорту                             |
  | `plugin-sdk/plugin-test-runtime`          | Фікстури runtime Plugin, реєстру, реєстрації provider, майстра налаштування та runtime TaskFlow для тестів                                                                  |
  | `plugin-sdk/provider-test-contracts`      | Допоміжні засоби контрактів runtime provider, автентифікації, виявлення, onboard, каталогу, медіаможливостей, політики replay, realtime STT live-audio, web-search/fetch і майстра |
  | `plugin-sdk/provider-http-test-mocks`     | Opt-in моки HTTP/auth для Vitest для тестів provider, які перевіряють `plugin-sdk/provider-http`                                                                            |
  | `plugin-sdk/test-env`                     | Фікстури тестового середовища, fetch/network, disposable HTTP server, вхідного запиту, live-test, тимчасової файлової системи та керування часом                           |
  | `plugin-sdk/test-fixtures`                | Загальні тестові фікстури для CLI, sandbox, skill, agent-message, system-event, перезавантаження модуля, шляху bundled plugin, terminal, chunking, auth-token і typed-case |
  | `plugin-sdk/test-node-mocks`              | Цільові допоміжні засоби моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")`                                                        |
  | `plugin-sdk/migration`                    | Допоміжні засоби елементів provider міграції, як-от `createMigrationItem`, константи причин, маркери статусу елемента, допоміжні засоби редагування та `summarizeMigrationItems` |
  | `plugin-sdk/migration-runtime`            | Допоміжні засоби runtime міграції, як-от `copyMigrationFileItem` і `writeMigrationReport`                                                                                   |

  <AccordionGroup>
  <Accordion title="Підшляхи каналу">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, запити allowlist, конструктори статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби конфігурації/шлюзу дій для кількох облікових записів, допоміжні засоби fallback облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису + fallback за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби списку облікових записів/дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу та загальний конструктор |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації bundled OpenClaw channel лише для підтримуваних bundled Plugin |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий псевдонім сумісності для bundled-channel config schemas |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із fallback bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні засоби життєвого циклу/фіналізації потоку чернеток |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби вхідного маршруту + конструктора envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису й диспетчеризації вхідних відповідей |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-send-deps` | Полегшений пошук залежностей вихідного надсилання для адаптерів каналу |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідної доставки, ідентичності, делегата надсилання, сесії, форматування та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу thread-binding та адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий конструктор payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби прив’язки conversation/thread, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб знімка конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби розв’язання group-policy у runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби знімка/зведення стану каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви channel config-schema |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти Plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби визначення group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби автентифікації/захисту direct-DM |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі допоміжні засоби інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для вхідного debounce, зіставлення mention, допоміжних засобів mention-policy та envelope helpers |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби вхідного debounce |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби mention-policy, маркерів mention і тексту mention без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби форматування вхідного envelope |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту та форматування розташування каналу |
    | `plugin-sdk/channel-logging` | Допоміжні засоби логування каналу для скидання вхідних повідомлень і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результату відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби дій із повідомленнями каналу, а також застарілі допоміжні засоби нативної схеми, збережені для сумісності Plugin |
    | `plugin-sdk/channel-route` | Спільні допоміжні засоби нормалізації маршруту, розв’язання цілей на основі parser, перетворення thread-id на рядок, dedupe/compact ключів маршруту, типів parsed-target і порівняння route/target |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору цілей; викликачам порівняння маршрутів слід використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-contract, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей secret |
  </Accordion>

  <Accordion title="Підшляхи Provider">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад provider LM Studio для налаштування, виявлення каталогу та підготовки моделі в runtime |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад runtime LM Studio для локальних стандартів сервера, виявлення моделей, заголовків запитів і допоміжних засобів loaded-model |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локального/self-hosted provider |
    | `plugin-sdk/self-hosted-provider-setup` | Цільові допоміжні засоби налаштування self-hosted provider, сумісного з OpenAI |
    | `plugin-sdk/cli-backend` | Стандартні значення бекенда CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби розв’язання API-key у runtime для plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби onboard/profile-write для API-key, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор auth-result для OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для plugin provider |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку auth env-var provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори replay-policy, допоміжні засоби endpoint provider і допоміжні засоби нормалізації model-id, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Хук runtime для розширення каталогу provider і шви реєстру plugin-provider для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби HTTP/endpoint capability provider, помилки HTTP provider і допоміжні засоби multipart form для аудіотранскрипції |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту config/selection для web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби config/credential для web-search для provider, яким не потрібне підключення enable plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту config/credential для web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і setter/getter облікових даних з обмеженою областю дії |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток stream і спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Нативні допоміжні засоби транспорту provider, як-от guarded fetch, перетворення transport message і потоки подій writable transport |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби виправлення конфігурації onboarding |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації групи та розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, включно з форматуванням меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Конструктори повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби розв’язання approver і авторизації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Нативні допоміжні засоби профілю/фільтра approval exec |
    | `plugin-sdk/approval-delivery-runtime` | Нативні адаптери можливостей/доставки approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб розв’язання Gateway approval |
    | `plugin-sdk/approval-handler-adapter-runtime` | Полегшені нативні допоміжні засоби завантаження адаптера approval для гарячих точок входу каналу |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби runtime обробника approval; віддавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Нативні допоміжні засоби цілі approval + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді approval для exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload approval для exec/plugin, нативні допоміжні засоби маршрутизації/runtime approval і структуровані допоміжні засоби відображення approval, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання dedupe вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і нативні допоміжні засоби session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Полегшені предикати тексту команд для гарячих шляхів каналу |
    | `plugin-sdk/command-surface` | Допоміжні засоби нормалізації command-body і command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь secret каналу/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби типізації `coerceSecretRef` і SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, DM gating, зовнішнього вмісту, редагування чутливого тексту, порівняння secret за константний час і збирання secret |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби host allowlist і політики SSRF для приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої поверхні runtime інфраструктури |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, fetch із захистом SSRF, помилки SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору secret input |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запитів/цілей Webhook і приведення raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру body/timeout запиту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/logging/backup/встановлення Plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби runtime env, logger, timeout, retry і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/стандартних значень, розбору URL CDP і допоміжних засобів автентифікації browser-control |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні засоби реєстрації та пошуку channel runtime-context |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/hook/http/interactive для Plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби pipeline для webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy імпорту/прив’язки runtime, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання process |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версії, виклику аргументів і lazy command-group |
    | `plugin-sdk/gateway-runtime` | Допоміжні засоби клієнта Gateway, Gateway CLI RPC, помилок протоколу Gateway і виправлення channel-status |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише для типів для форм конфігурації Plugin, як-от `OpenClawConfig` і типів конфігурації channel/provider |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку plugin-config у runtime, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної мутації конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot` і setter-и тестових знімків |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації назви/опису команди Telegram і перевірки дублікатів/конфліктів, навіть коли поверхня bundled-контракту Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink посилань на файли без широкого barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби approval для exec/plugin, конструктори approval-capability, допоміжні засоби auth/profile, нативні допоміжні засоби маршрутизації/runtime і форматування шляху структурованого відображення approval |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби runtime для inbound/reply, chunking, dispatch, Heartbeat, планувальник reply |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize reply і допоміжні засоби conversation-label |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби коротковіконної history reply і маркери, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking text/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сесій, session-key, updated-at і мутації сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/load/save для сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів каталогів state/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби прив’язки route/session-key/account, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби зведення статусу каналу/облікового запису, стандартні значення runtime-state і допоміжні засоби метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби розв’язання цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Видобування рядкових URL із входів, подібних до fetch/request |
    | `plugin-sdk/run-command` | Виконавець команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Загальні читачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Видобування нормалізованих payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Видобування канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні засоби logger підсистеми та редагування |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму та перетворення таблиць Markdown |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення model/session, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби розв’язання конфігурації talk provider |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Реентерабельні допоміжні засоби file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу dedupe з дисковою підтримкою |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби runtime/session і reply-dispatch для ACP |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання прив’язок ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви config-schema runtime агента |
    | `plugin-sdk/boolean-param` | Гнучкий читач булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби розв’язання зіставлення dangerous-name |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби початкового налаштування пристрою та токенів pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді `/models` command/provider |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби переліку команд skill |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/build/serialize нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агента: типи harness, допоміжні засоби steer/abort активного запуску, допоміжні засоби мосту OpenClaw tool, допоміжні засоби політики tool у runtime-plan, класифікація результатів terminal і допоміжні засоби форматування/деталізації прогресу tool та утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.A.I |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб process-local async lock для невеликих файлів стану runtime |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб telemetry активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеженої concurrency асинхронних завдань |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби кешу dedupe в пам’яті |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб спорожнення черги очікуваної вихідної доставки |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів локальних файлів і джерел медіа |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби подій і видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Допоміжний засіб числового приведення |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних токенів/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте наведені вище цільові підшляхи runtime |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичних прапорців, подій і trace-context |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні засоби обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Читач body відповіді з обмеженням без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки conversation без маршрутизації configured binding або сховищ pairing |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Допоміжні засоби розв’язання видимості контексту та фільтрації додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення й нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і виконання retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогу/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/dedupe каталогу з підтримкою конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби fetch/transform/store для медіа, а також конструктори media payload |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби сховища медіа, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover для генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи provider для розуміння медіа, а також експорти допоміжних засобів для зображень/аудіо, орієнтовані на provider |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби text/markdown/logging, як-от вилучення тексту, видимого помічнику, допоміжні засоби рендерингу/chunking/таблиць Markdown, допоміжні засоби редагування, допоміжні засоби directive-tag і утиліти safe-text |
    | `plugin-sdk/text-chunking` | Допоміжний засіб chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи speech provider, а також експорти допоміжних засобів directive, registry, validation, конструктора TTS, сумісного з OpenAI, і speech helper |
    | `plugin-sdk/speech-core` | Спільні типи speech provider, а також експорти допоміжних засобів registry, directive, normalization і speech helper |
    | `plugin-sdk/realtime-transcription` | Типи provider для realtime transcription, допоміжні засоби registry і спільний допоміжний засіб сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи provider для realtime voice і допоміжні засоби registry |
    | `plugin-sdk/image-generation` | Типи provider для генерації зображень, а також допоміжні засоби image asset/data URL |
    | `plugin-sdk/image-generation-core` | Спільні типи image-generation, допоміжні засоби failover, auth і registry |
    | `plugin-sdk/music-generation` | Типи provider/request/result для генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи music-generation, допоміжні засоби failover, пошук provider і розбір model-ref |
    | `plugin-sdk/video-generation` | Типи provider/request/result для генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи video-generation, допоміжні засоби failover, пошук provider і розбір model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні засоби registry цілей Webhook і встановлення route |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | Широкий сумісний barrel для застарілих тестів Plugin. Нові тести extension мають імпортувати натомість цільові підшляхи SDK, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний допоміжний засіб `createTestPluginApi` для прямих модульних тестів реєстрації Plugin без імпорту мостів допоміжних засобів тестування репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Фікстури контрактів нативного адаптера agent-runtime для тестів auth, delivery, fallback, tool-hook, prompt-overlay, schema і проєкції transcript |
    | `plugin-sdk/channel-test-helpers` | Допоміжні засоби тестування, орієнтовані на канал, для загальних контрактів actions/setup/status, перевірок каталогу, життєвого циклу запуску облікового запису, threading send-config, моків runtime, проблем статусу, вихідної доставки та реєстрації hook |
    | `plugin-sdk/channel-target-testing` | Спільний набір випадків помилок розв’язання цілей для тестів каналу |
    | `plugin-sdk/plugin-test-contracts` | Допоміжні засоби контрактів пакета Plugin, реєстрації, публічного артефакту, прямого імпорту, runtime API і побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Допоміжні засоби контрактів runtime, auth, discovery, onboard, catalog, wizard, media capability, replay policy, realtime STT live-audio, web-search/fetch і stream для provider |
    | `plugin-sdk/provider-http-test-mocks` | Opt-in моки HTTP/auth для Vitest для тестів provider, які перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Загальні фікстури захоплення runtime CLI, контексту sandbox, writer skill, agent-message, system-event, перезавантаження модуля, шляху bundled plugin, terminal-text, chunking, auth-token і typed-case |
    | `plugin-sdk/test-node-mocks` | Цільові допоміжні засоби моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Subpath | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для manager/config/file/CLI helper |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до registry, локальний provider і загальні допоміжні засоби batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти engine QMD хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти engine сховища хоста пам’яті |
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
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби managed-markdown для plugin, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до менеджера пошуку |
    | `plugin-sdk/memory-host-status` | Нейтральний до постачальника псевдонім для допоміжних засобів статусу хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Family | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки bundled browser plugin. `browser-profiles` експортує `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` і `ResolvedBrowserTabCleanupConfig` для нормалізованої форми `browser.tabCleanup`. `browser-support` залишається barrel сумісності. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня bundled Matrix helper/runtime |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня bundled LINE helper/runtime |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня bundled IRC helper |
    | Допоміжні засоби, специфічні для каналу | `plugin-sdk/googlechat`, `plugin-sdk/googlechat-runtime-shared`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu`, `plugin-sdk/feishu-conversation`, `plugin-sdk/feishu-setup`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/telegram-command-ui`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` | Застарілі шви сумісності/допоміжних засобів bundled channel. Нові Plugin мають імпортувати загальні підшляхи SDK або локальні barrel-файли Plugin. |
    | Допоміжні засоби, специфічні для auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/memory-core`, `plugin-sdk/memory-lancedb`, `plugin-sdk/opencode`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Шви допоміжних засобів bundled feature/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
