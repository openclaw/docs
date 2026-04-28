---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту плагіна
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розміщені, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-28T01:06:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63abca6e6246162215a95c0f9351f4b36d0cd481a9710a0464db013385ae68bc
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK представлено як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено каталог поширено вживаних підшляхів, згрупованих за призначенням. Згенерований
  повний список із 200+ підшляхів зберігається в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також з’являються там, але є
  деталлю реалізації, якщо лише сторінка документації явно не просуває їх.

  Посібник з розробки плагінів див. у [Огляд Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу плагіна

  | Підшлях                              | Ключові експорти                                                                                                                                        |
  | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`            | `definePluginEntry`                                                                                                                                      |
  | `plugin-sdk/core`                    | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                   |
  | `plugin-sdk/config-schema`           | `OpenClawSchema`                                                                                                                                         |
  | `plugin-sdk/provider-entry`          | `defineSingleProviderPluginEntry`                                                                                                                        |
  | `plugin-sdk/testing`                 | Широкий сумісний barrel для застарілих тестів плагінів; для нових тестів розширень віддавайте перевагу цільовим тестовим підшляхам                     |
  | `plugin-sdk/plugin-test-api`         | Мінімальний конструктор моку `OpenClawPluginApi` для модульних тестів прямої реєстрації плагіна                                                         |
  | `plugin-sdk/channel-test-helpers`    | Допоміжні засоби для тестування життєвого циклу облікового запису каналу, директорії, конфігурації надсилання, моку runtime, hook і загального контракту каналу |
  | `plugin-sdk/channel-target-testing`  | Спільний набір тестів для випадків помилок під час розв’язання цілей каналу                                                                              |
  | `plugin-sdk/plugin-test-contracts`   | Допоміжні засоби для контрактів реєстрації плагіна, маніфесту пакета, публічного артефакту, runtime API, побічних ефектів імпорту та прямого імпорту    |
  | `plugin-sdk/plugin-test-runtime`     | Фікстури runtime плагіна, реєстру, реєстрації провайдера, майстра налаштування та runtime TaskFlow для тестів                                           |
  | `plugin-sdk/provider-test-contracts` | Допоміжні засоби для контрактів runtime провайдера, автентифікації, виявлення, онбордингу, каталогу, web-search/fetch і майстра                        |
  | `plugin-sdk/test-env`                | Фікстури тестового середовища, fetch/мережі, live-тестів, тимчасової файлової системи та керування часом                                                |
  | `plugin-sdk/test-fixtures`           | Загальні тестові фікстури для CLI, sandbox, skill, agent-message, system-event, terminal, chunking, auth-token і типізованих кейсів                    |
  | `plugin-sdk/migration`               | Допоміжні засоби для елементів провайдера міграції, як-от `createMigrationItem`, константи причин, маркери статусу елементів, засоби редагування та `summarizeMigrationItems` |
  | `plugin-sdk/migration-runtime`       | Допоміжні засоби runtime міграції, як-от `copyMigrationFileItem` і `writeMigrationReport`                                                               |

  <AccordionGroup>
  <Accordion title="Підшляхи каналу">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, запити allowlist, конструктори статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби для багатокористувацької конфігурації/керування діями та запасного використання облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації ідентифікатора облікового запису |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису та запасного використання значення за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для списку облікових записів/дій з обліковими записами |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу та загальний конструктор |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілі схеми конфігурації bundled-channel лише для сумісності з вбудованими компонентами |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із запасним сумісним контрактом bundled |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби для шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні засоби життєвого циклу/фіналізації чернеткового потоку |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби для маршрутизації вхідних повідомлень і побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби для запису й диспетчеризації вхідних відповідей |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-send-deps` | Полегшений пошук залежностей вихідного надсилання для адаптерів каналу |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби для вихідної доставки, ідентичності, делегата надсилання, сесії, форматування та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу прив’язок потоків і адаптерів |
    | `plugin-sdk/agent-media-payload` | Застарілий конструктор payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби для прив’язки conversation/thread, pairing і налаштованих binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб знімка конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби розв’язання групової політики runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби знімка/підсумку стану каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти плагіна каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби для рішень щодо доступу групи |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби для автентифікації/захисту direct-DM |
    | `plugin-sdk/interactive-runtime` | Семантичні допоміжні засоби для представлення повідомлень, доставки та застарілих інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Сумісний barrel для debounce вхідних повідомлень, зіставлення згадок, допоміжних засобів політики згадок і envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби debounce вхідних повідомлень |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби політики згадок, маркерів згадок і тексту згадок без ширшої поверхні runtime вхідних повідомлень |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби форматування envelope вхідних повідомлень |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту розташування каналу та форматування |
    | `plugin-sdk/channel-logging` | Допоміжні засоби логування каналу для відкидання вхідних повідомлень і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результату відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби для дій із повідомленнями каналу, а також застарілі допоміжні засоби нативної схеми, збережені для сумісності плагінів |
    | `plugin-sdk/channel-route` | Спільні допоміжні засоби нормалізації маршруту, розв’язання цілей на основі парсера, перетворення thread-id на рядок, dedupe/compact ключів маршруту, типів parsed-target і порівняння route/target |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору цілей; виклики порівняння маршрутів мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби секретного контракту, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей секретів |
  </Accordion>

  <Accordion title="Підшляхи провайдера">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделі runtime |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад runtime LM Studio для локальних значень сервера за замовчуванням, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Цільові допоміжні засоби налаштування self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Значення backend CLI за замовчуванням + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби розв’язання API-ключа runtime для плагінів провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/запису профілю API-ключа, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор результату OAuth-автентифікації |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для плагінів провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env vars для автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори політик replay, допоміжні засоби endpoint провайдера та нормалізації model-id, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Хук runtime каталогу провайдера та шви реєстру plugin-provider для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби HTTP/можливостей endpoint провайдера, помилки HTTP провайдера та допоміжні засоби multipart form для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту конфігурації/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення ввімкнення плагіна |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і scoped setter/getter для облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика та допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоку та спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспорту провайдера, як-от guarded fetch, трансформації транспортних повідомлень і потоки подій writable transport |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби патчингу конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації групи та розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, включно з форматуванням меню динамічних аргументів, допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Конструктори повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби розв’язання схвалювача та автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби профілю/фільтра схвалення нативного exec |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери можливостей/доставки нативного схвалення |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб розв’язання Gateway схвалення |
    | `plugin-sdk/approval-handler-adapter-runtime` | Полегшені допоміжні засоби завантаження адаптера нативного схвалення для гарячих точок входу каналу |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби runtime обробника схвалення; віддавайте перевагу вужчим швам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби нативної цілі схвалення + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді для схвалення exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload схвалення exec/plugin, нативні допоміжні засоби маршрутизації/runtime схвалення та допоміжні засоби структурованого показу схвалення, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання dedupe вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і допоміжні засоби нативної session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Полегшені предикати тексту команд для гарячих шляхів каналу |
    | `plugin-sdk/command-surface` | Допоміжні засоби нормалізації тіла команди та поверхні команди |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання секретного контракту для секретних поверхонь каналу/плагіна |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, шлюзу DM, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів у сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF для allowlist хостів і приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої поверхні runtime інфраструктури |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, fetch із захистом SSRF, помилки SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору секретного вводу |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запиту/цілі Webhook і приведення raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру тіла запиту/тайм-ауту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби runtime/логування/резервного копіювання/встановлення плагінів |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби env runtime, logger, timeout, retry і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/значень за замовчуванням, розбору URL CDP і допоміжних засобів автентифікації browser-control |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні засоби реєстрації та пошуку runtime-context каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/hook/http/interactive плагіна |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби конвеєра webhook/internal hook |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого імпорту/прив’язки runtime, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби exec процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версій, виклику аргументів і лінивих груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, CLI RPC Gateway, помилки протоколу Gateway та допоміжні засоби patch для стану каналу |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише для типів для форм конфігурації плагіна, як-от `OpenClawConfig` і типи конфігурації каналу/провайдера |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку конфігурації плагіна runtime, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної мутації конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot` і test snapshot setter-и |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації назв/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли поверхня контракту bundled Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби схвалення exec/plugin, конструктори можливостей схвалення, допоміжні засоби auth/profile, нативні допоміжні засоби маршрутизації/runtime і форматування шляху структурованого відображення схвалення |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби runtime вхідних повідомлень/відповідей, chunking, dispatch, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize відповіді та підписів conversation |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби історії відповідей для короткого вікна та маркери, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сесій, ключа сесії, updated-at і мутації сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів до каталогів state/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби маршруту/ключа сесії/прив’язки облікового запису, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби підсумку стану каналу/облікового запису, значень runtime-state за замовчуванням і метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби розв’язання цілі |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL із вводів типу fetch/request |
    | `plugin-sdk/run-command` | Запускач команд із тайм-аутом і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені читачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні засоби logger підсистеми та редагування |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму таблиць Markdown і перетворення |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби override моделі/сесії, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби розв’язання конфігурації talk provider |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису JSON state |
    | `plugin-sdk/file-lock` | Допоміжні засоби повторно вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу dedupe на диску |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби runtime/сесії ACP і dispatch відповідей |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання прив’язки ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Читач нечітких булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби розв’язання збігів небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та токена pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді провайдера/команди `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби переліку команд skill |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/побудови/серіалізації нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агента: типи harness, допоміжні засоби steer/abort для активних запусків, допоміжні засоби мосту інструментів OpenClaw, допоміжні засоби політики tool для плану runtime, класифікація результатів terminal, допоміжні засоби форматування/деталізації прогресу tool і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб process-local async lock для малих файлів стану runtime |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеженої конкурентності async-задач |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби кешу dedupe у пам’яті |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб дренування черги очікуваної вихідної доставки |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів до локальних файлів і джерел медіа |
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
    | `plugin-sdk/response-limit-runtime` | Читач обмеженого тіла відповіді без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки conversation без маршрутизації налаштованих binding або сховищ pairing |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби сховища сесій без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Допоміжні засоби розв’язання видимості контексту та фільтрації додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення та нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і виконання retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогу/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/dedup директорій на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби fetch/transform/store для медіа, а також конструктори media payload |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби сховища медіа, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover для генерації медіа, вибір кандидатів і повідомлення про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдера розуміння медіа, а також провайдер-орієнтовані допоміжні експорти для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби text/markdown/logging, як-от видалення видимого асистенту тексту, допоміжні засоби рендерингу/chunking/table для markdown, засоби редагування, допоміжні засоби тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдера мовлення, а також провайдер-орієнтовані експорти директив, реєстру, валідації та допоміжних засобів мовлення |
    | `plugin-sdk/speech-core` | Спільні типи провайдера мовлення, експорти реєстру, директив, нормалізації та допоміжних засобів мовлення |
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
    | `plugin-sdk/testing` | Широкий сумісний barrel для застарілих тестів плагінів. Нові тести розширень мають імпортувати цільові підшляхи SDK, наприклад `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний допоміжний засіб `createTestPluginApi` для модульних тестів прямої реєстрації плагіна без імпорту мостів допоміжних засобів тестування репозиторію |
    | `plugin-sdk/channel-test-helpers` | Орієнтовані на канал допоміжні засоби тестування для загальних контрактів actions/setup/status, перевірок директорій, життєвого циклу запуску облікового запису, threading конфігурації надсилання, моків runtime, проблем статусу, вихідної доставки та реєстрації hook |
    | `plugin-sdk/channel-target-testing` | Спільний набір тестів випадків помилок під час розв’язання цілей для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Допоміжні засоби контрактів пакета плагіна, реєстрації, публічного артефакту, прямого імпорту, runtime API та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Допоміжні засоби контрактів runtime, auth, discovery, onboard, catalog, wizard, web-search/fetch і stream провайдера |
    | `plugin-sdk/test-fixtures` | Загальні фікстури для захоплення runtime CLI, контексту sandbox, записувача skill, agent-message, system-event, terminal-text, chunking, auth-token і типізованих кейсів |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для manager/config/file/CLI helpers |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний провайдер і загальні допоміжні засоби batch/remote |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті |
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
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби керованого markdown для плагінів, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний до постачальника псевдонім для допоміжних засобів статусу хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Сімейство | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки bundled browser plugin. `browser-profiles` експортує `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` і `ResolvedBrowserTabCleanupConfig` для нормалізованої форми `browser.tabCleanup`. `browser-support` залишається сумісним barrel. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня bundled Matrix helper/runtime |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня bundled LINE helper/runtime |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня bundled IRC helper |
    | Channel-specific helpers | `plugin-sdk/googlechat`, `plugin-sdk/googlechat-runtime-shared`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu`, `plugin-sdk/feishu-conversation`, `plugin-sdk/feishu-setup`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/telegram-command-ui`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` | Застарілі bundled channel compatibility/helper seams. Нові плагіни мають імпортувати загальні підшляхи SDK або локальні barrel-и плагіна. |
    | Auth/plugin-specific helpers | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/memory-core`, `plugin-sdk/memory-lancedb`, `plugin-sdk/opencode`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Bundled feature/plugin helper seams; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення плагінів](/uk/plugins/building-plugins)
