---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів bundled-plugin і поверхонь допоміжних функцій
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розміщені, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-28T00:03:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a51833cc4d8136f4e432822f3fc27e38373784519cfcb7ce209dbe01fa0a325
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK представлений як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено каталог поширених підшляхів, згрупованих за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься у `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також наведені там, але є деталями
  реалізації, якщо лише певна сторінка документації явно не рекомендує їх.

  Посібник з розробки Plugin див. у [Огляд Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Підшлях                              | Основні експорти                                                                                                                                        |
  | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`            | `definePluginEntry`                                                                                                                                     |
  | `plugin-sdk/core`                    | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                  |
  | `plugin-sdk/config-schema`           | `OpenClawSchema`                                                                                                                                        |
  | `plugin-sdk/provider-entry`          | `defineSingleProviderPluginEntry`                                                                                                                       |
  | `plugin-sdk/testing`                 | Публічні тестові фікстури Plugin, допоміжні функції реєстрації/каталогу провайдерів, хуки контрактів майстра та допоміжні функції підтримки контрактів bundled-plugin |
  | `plugin-sdk/plugin-test-api`         | Мінімальний конструктор мока `OpenClawPluginApi` для прямих модульних тестів реєстрації Plugin                                                         |
  | `plugin-sdk/channel-test-helpers`    | Допоміжні функції для тестування життєвого циклу облікового запису каналу, директорії, конфігурації надсилання, мока середовища виконання та хуків    |
  | `plugin-sdk/plugin-test-contracts`   | Допоміжні функції контрактів для реєстрації Plugin, маніфесту пакета, публічного артефакту, API середовища виконання, побічного ефекту імпорту та прямого імпорту |
  | `plugin-sdk/provider-test-contracts` | Допоміжні функції контрактів для середовища виконання провайдера, автентифікації, виявлення, онбордингу, каталогу, web-search/fetch і майстра          |
  | `plugin-sdk/migration`               | Допоміжні функції елементів провайдера міграції, як-от `createMigrationItem`, константи причин, маркери статусу елементів, допоміжні функції редагування та `summarizeMigrationItems` |
  | `plugin-sdk/migration-runtime`       | Допоміжні функції міграції для середовища виконання, як-от `copyMigrationFileItem` і `writeMigrationReport`                                            |

  <AccordionGroup>
  <Accordion title="Підшляхи каналу">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні функції майстра налаштування, підказки allowlist, конструктори статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні функції конфігурації/шлюзу дій для кількох облікових записів, допоміжні функції резервного переходу до облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні функції нормалізації ідентифікатора облікового запису |
    | `plugin-sdk/account-resolution` | Допоміжні функції пошуку облікового запису та резервного переходу до типового значення |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні функції списку облікових записів/дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу та узагальнений конструктор |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілі схеми конфігурації bundled-channel лише для сумісності з bundled |
    | `plugin-sdk/telegram-command-config` | Допоміжні функції нормалізації/валідації користувацьких команд Telegram із резервною підтримкою bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі допоміжні функції шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні функції життєвого циклу/фіналізації чернеткового потоку |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні функції маршрутів вхідних повідомлень і конструктора envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні функції запису та диспетчеризації вхідних відповідей |
    | `plugin-sdk/messaging-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні функції завантаження вихідних медіа |
    | `plugin-sdk/outbound-send-deps` | Легковаговий пошук залежностей надсилання вихідних повідомлень для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Допоміжні функції доставки вихідних повідомлень, ідентичності, делегата надсилання, сесії, форматування та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні функції нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні функції життєвого циклу thread-binding і адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий конструктор payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні функції прив’язки conversation/thread, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжна функція знімка конфігурації середовища виконання |
    | `plugin-sdk/runtime-group-policy` | Допоміжні функції визначення group-policy для середовища виконання |
    | `plugin-sdk/channel-status` | Спільні допоміжні функції знімка/зведення статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні функції авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти Plugin каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні функції редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні функції рішень щодо group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні функції автентифікації/захисту direct-DM |
    | `plugin-sdk/interactive-runtime` | Допоміжні функції семантичного представлення повідомлень, доставки та застарілих інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Барель сумісності для debounce вхідних повідомлень, зіставлення згадок, допоміжних функцій mention-policy та envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні функції debounce вхідних повідомлень |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні функції mention-policy, маркерів згадок і тексту згадок без ширшої поверхні середовища виконання вхідних повідомлень |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні функції форматування вхідних envelope |
    | `plugin-sdk/channel-location` | Допоміжні функції контексту та форматування розташування каналу |
    | `plugin-sdk/channel-logging` | Допоміжні функції логування каналу для відкидання вхідних повідомлень і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні функції дій з повідомленнями каналу, а також застарілі допоміжні функції native schema, збережені для сумісності Plugin |
    | `plugin-sdk/channel-targets` | Допоміжні функції розбору/зіставлення цілей |
    | `plugin-sdk/channel-contract` | Типи контрактів каналу |
    | `plugin-sdk/channel-feedback` | Зв’язування feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції secret-contract, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей secret |
  </Accordion>

  <Accordion title="Підшляхи провайдера">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделі в середовищі виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад середовища виконання LM Studio для типових параметрів локального сервера, виявлення моделей, заголовків запитів і допоміжних функцій для завантажених моделей |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні функції налаштування локального/self-hosted провайдера |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні функції налаштування self-hosted провайдера, сумісного з OpenAI |
    | `plugin-sdk/cli-backend` | Типові значення CLI backend + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні функції визначення API-key у середовищі виконання для Plugin провайдера |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні функції онбордингу/запису профілю API-key, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор результату автентифікації OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні функції інтерактивного входу для Plugin провайдера |
    | `plugin-sdk/provider-env-vars` | Допоміжні функції пошуку auth env var провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори replay-policy, допоміжні функції endpoint провайдера та допоміжні функції нормалізації model-id, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Хук середовища виконання каталогу провайдера та шви реєстру plugin-provider для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні функції HTTP/можливостей endpoint провайдера, помилки HTTP провайдера та допоміжні функції multipart form для аудіотранскрипції |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні функції контракту config/selection для web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні функції реєстрації/кешу провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні функції config/credential для web-search для провайдерів, яким не потрібне вбудовування enable Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні функції контракту config/credential для web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setters/getters облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні функції реєстрації/кешу/середовища виконання провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та допоміжні функції сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні допоміжні функції wrapper для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні функції транспорту нативного провайдера, як-от guarded fetch, перетворення transport message і writable потоки transport event |
    | `plugin-sdk/provider-onboard` | Допоміжні функції patch конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні функції singleton/map/cache, локальних для процесу |
    | `plugin-sdk/group-activation` | Вузькі допоміжні функції режиму активації групи та розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні функції реєстру команд, включно з форматуванням меню динамічних аргументів, допоміжні функції авторизації відправника |
    | `plugin-sdk/command-status` | Конструктори повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні функції визначення затверджувача та автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні функції профілю/фільтра затвердження native exec |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери можливостей/доставки native approval |
    | `plugin-sdk/approval-gateway-runtime` | Спільна допоміжна функція визначення Gateway approval |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковагові допоміжні функції завантаження адаптера native approval для гарячих точок входу каналу |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні функції середовища виконання approval handler; віддавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні функції цілі native approval + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні функції payload відповіді для затвердження exec/Plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні функції payload затвердження exec/Plugin, допоміжні функції маршрутизації/середовища виконання native approval і допоміжні функції структурованого відображення approval, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні функції скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні функції тестування контрактів каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і допоміжні функції native session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні функції виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легковагові предикати тексту команд для гарячих шляхів каналу |
    | `plugin-sdk/command-surface` | Допоміжні функції нормалізації command-body і command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції збирання secret-contract для поверхонь secret каналу/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні функції `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні функції trust, DM gating, external-content, редагування чутливого тексту, порівняння secret за сталий час і збирання secret |
    | `plugin-sdk/ssrf-policy` | Допоміжні функції allowlist хостів і політики SSRF для приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні функції pinned-dispatcher без широкої поверхні infra runtime |
    | `plugin-sdk/ssrf-runtime` | Допоміжні функції pinned-dispatcher, fetch із захистом SSRF, помилки SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні функції розбору secret input |
    | `plugin-sdk/webhook-ingress` | Допоміжні функції запиту/цілі Webhook і приведення raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні функції розміру body/timeout запиту |
  </Accordion>

  <Accordion title="Підшляхи середовища виконання та сховища">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні функції середовища виконання/логування/резервного копіювання/встановлення Plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні функції env середовища виконання, logger, timeout, retry і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових значень, розбору URL CDP і допоміжних функцій автентифікації browser-control |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні функції реєстрації та пошуку runtime-context каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні функції команд/хуків/http/interactive Plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні функції конвеєра Webhook/внутрішніх хуків |
    | `plugin-sdk/lazy-runtime` | Допоміжні функції lazy import/binding середовища виконання, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні функції exec процесу |
    | `plugin-sdk/cli-runtime` | Допоміжні функції форматування CLI, wait, version, invocation аргументів і lazy command-group |
    | `plugin-sdk/gateway-runtime` | Допоміжні функції клієнта Gateway, CLI RPC Gateway, помилок протоколу Gateway та patch статусу каналу |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише для типів для форм конфігурації Plugin, як-от `OpenClawConfig` і типів конфігурації каналу/провайдера |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні функції пошуку plugin-config у середовищі виконання, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні функції транзакційної мутації конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні функції знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot` і setters знімків для тестів |
    | `plugin-sdk/telegram-command-config` | Допоміжні функції нормалізації назв/описів команд Telegram і перевірок дублікатів/конфліктів, навіть коли поверхня контракту bundled Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення autolink посилань на файли без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Допоміжні функції затвердження exec/Plugin, конструктори approval-capability, допоміжні функції auth/profile, допоміжні функції native routing/runtime і форматування структурованого шляху відображення approval |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні функції середовища виконання для вхідних повідомлень/відповідей, chunking, dispatch, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні функції dispatch/finalize відповідей і conversation-label |
    | `plugin-sdk/reply-history` | Спільні допоміжні функції та маркери історії відповідей для короткого вікна, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні функції chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні функції шляху сховища сесій, session-key, updated-at і мутації сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні функції шляху/load/save сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні функції шляхів директорій state/OAuth |
    | `plugin-sdk/routing` | Допоміжні функції маршруту/ключа сесії/прив’язки облікового запису, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні функції зведення статусу каналу/облікового запису, типові значення runtime-state і допоміжні функції метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні функції target resolver |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні функції нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL із вхідних даних типу fetch/request |
    | `plugin-sdk/run-command` | Виконавець команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені читачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні функції шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні функції logger підсистеми та редагування |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні функції режиму та конвертації таблиць Markdown |
    | `plugin-sdk/model-session-runtime` | Допоміжні функції перевизначення моделі/сесії, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні функції визначення конфігурації провайдера talk |
    | `plugin-sdk/json-store` | Невеликі допоміжні функції читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні функції реентерабельного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні функції кешу дедуплікації на диску |
    | `plugin-sdk/acp-runtime` | Допоміжні функції середовища виконання/сесії ACP і dispatch відповідей |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання прив’язки ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви schema конфігурації середовища виконання агента |
    | `plugin-sdk/boolean-param` | Читач вільного boolean параметра |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні функції розв’язання збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні функції початкової ініціалізації пристрою та pairing token |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних функцій passive-channel, статусу й ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні функції відповідей команди `/models`/провайдера |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні функції списку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні функції реєстру/build/serialize нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агента: типи harness, допоміжні функції steer/abort активного запуску, допоміжні функції мосту інструментів OpenClaw, допоміжні функції політики tool для runtime-plan, класифікація результатів terminal, допоміжні функції форматування/деталізації прогресу tool і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні функції виявлення endpoint Z.A.I |
    | `plugin-sdk/async-lock-runtime` | Допоміжна функція локального для процесу async lock для невеликих файлів runtime state |
    | `plugin-sdk/channel-activity-runtime` | Допоміжна функція telemetry активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжна функція обмеженої конкурентності async задач |
    | `plugin-sdk/dedupe-runtime` | Допоміжні функції кешу дедуплікації в пам’яті |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжна функція drain черги очікуваної вихідної доставки |
    | `plugin-sdk/file-access-runtime` | Допоміжні функції безпечних шляхів до локальних файлів і джерел медіа |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні функції подій і видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Допоміжна функція приведення чисел |
    | `plugin-sdk/secure-random-runtime` | Допоміжні функції безпечних token/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні функції черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжна функція очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте наведені вище сфокусовані підшляхи середовища виконання |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні функції обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні функції прапорців, подій і trace-context діагностики |
    | `plugin-sdk/error-runtime` | Допоміжні функції графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні функції обгорнутого fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Читач обмеженого response body без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки conversation без маршрутизації configured binding або pairing stores |
    | `plugin-sdk/session-store-runtime` | Допоміжні функції session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту та фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні функції приведення й нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні функції нормалізації hostname і хоста SCP |
    | `plugin-sdk/retry-runtime` | Допоміжні функції конфігурації retry і виконавця retry |
    | `plugin-sdk/agent-runtime` | Допоміжні функції директорії/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/dedup директорії на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні функції fetch/transform/store медіа, а також конструктори payload медіа |
    | `plugin-sdk/media-store` | Вузькі допоміжні функції media store, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні функції failover генерації медіа, вибору кандидатів і повідомлень про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдера media understanding, а також експорти допоміжних функцій для зображень/аудіо, орієнтованих на провайдера |
    | `plugin-sdk/text-runtime` | Спільні допоміжні функції text/markdown/logging, як-от видалення видимого для асистента тексту, допоміжні функції render/chunking/table для Markdown, допоміжні функції редагування, допоміжні функції тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжна функція chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдера speech, а також експорти допоміжних функцій директив, реєстру, валідації та speech, орієнтованих на провайдера |
    | `plugin-sdk/speech-core` | Спільні типи провайдера speech, а також експорти допоміжних функцій реєстру, директив, нормалізації та speech |
    | `plugin-sdk/realtime-transcription` | Типи провайдера realtime transcription, допоміжні функції реєстру та спільна допоміжна функція сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдера realtime voice і допоміжні функції реєстру |
    | `plugin-sdk/image-generation` | Типи провайдера генерації зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, допоміжні функції failover, auth і реєстру |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні функції failover, пошук провайдера та розбір model-ref |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні функції failover, пошук провайдера та розбір model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні функції реєстру цілей Webhook і встановлення маршруту |
    | `plugin-sdk/webhook-path` | Допоміжні функції нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні функції завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | Публічні допоміжні функції тестування extension, включно з моками реєстру/runtime Plugin, захопленням реєстрації провайдера, допоміжними функціями майстра налаштування, фікстурами fetch/env/temp/time, допоміжними функціями schema/media/live-test, `installCommonResolveTargetErrorCases`, `writeSkill`, `createTestRegistry` і завантаженням env для live generation. Допоміжні функції extension `*.test-support.ts` мають залишатися тут або на сфокусованих підшляхах SDK, а не в core internals |
    | `plugin-sdk/plugin-test-api` | Мінімальна допоміжна функція `createTestPluginApi` для прямих модульних тестів реєстрації Plugin без імпорту містків допоміжних функцій тестування репозиторію |
    | `plugin-sdk/channel-test-helpers` | Орієнтовані на канал допоміжні функції тестування для життєвого циклу запуску облікового запису, перевірок директорії, threading конфігурації надсилання, моків runtime, проблем статусу, вихідної доставки та реєстрації хуків |
    | `plugin-sdk/plugin-test-contracts` | Допоміжні функції контрактів для пакета Plugin, реєстрації, публічного артефакту, прямого імпорту, API runtime та побічного ефекту імпорту |
    | `plugin-sdk/provider-test-contracts` | Допоміжні функції контрактів для runtime провайдера, auth, discovery, onboard, catalog, wizard, web-search/fetch і stream |
  </Accordion>

  <Accordion title="Підшляхи Memory">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних функцій bundled memory-core для менеджера/конфігурації/файлів/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад середовища виконання індексу/пошуку Memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста Memory, доступ до реєстру, локальний провайдер і загальні допоміжні функції batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста Memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста Memory |
    | `plugin-sdk/memory-core-host-multimodal` | Допоміжні функції multimodal хоста Memory |
    | `plugin-sdk/memory-core-host-query` | Допоміжні функції query хоста Memory |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні функції secret хоста Memory |
    | `plugin-sdk/memory-core-host-events` | Допоміжні функції журналу подій хоста Memory |
    | `plugin-sdk/memory-core-host-status` | Допоміжні функції статусу хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні функції CLI runtime хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні функції core runtime хоста Memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні функції файлів/runtime хоста Memory |
    | `plugin-sdk/memory-host-core` | Нейтральний до вендора псевдонім для допоміжних функцій core runtime хоста Memory |
    | `plugin-sdk/memory-host-events` | Нейтральний до вендора псевдонім для допоміжних функцій журналу подій хоста Memory |
    | `plugin-sdk/memory-host-files` | Нейтральний до вендора псевдонім для допоміжних функцій файлів/runtime хоста Memory |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні функції managed-markdown для plugin, суміжних із memory |
    | `plugin-sdk/memory-host-search` | Фасад середовища виконання Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний до вендора псевдонім для допоміжних функцій статусу хоста Memory |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних функцій bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Family | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні функції підтримки bundled browser plugin. `browser-profiles` експортує `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` і `ResolvedBrowserTabCleanupConfig` для нормалізованої форми `browser.tabCleanup`. `browser-support` залишається barrel сумісності. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня допоміжних функцій/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня допоміжних функцій/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня допоміжних функцій bundled IRC |
    | Допоміжні функції для конкретних каналів | `plugin-sdk/googlechat`, `plugin-sdk/googlechat-runtime-shared`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu`, `plugin-sdk/feishu-conversation`, `plugin-sdk/feishu-setup`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/telegram-command-ui`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` | Застарілі шви сумісності/допоміжних функцій bundled channel. Нові plugins мають імпортувати загальні підшляхи SDK або локальні barrel модуля plugin. |
    | Допоміжні функції auth/plugin для конкретних сценаріїв | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/memory-core`, `plugin-sdk/memory-lancedb`, `plugin-sdk/opencode`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Шви допоміжних функцій bundled feature/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
