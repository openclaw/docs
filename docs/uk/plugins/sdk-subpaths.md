---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів bundled-plugin і допоміжних поверхонь
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розміщені, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-28T03:09:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 466bde9b1ba40a916e5d352497ff3c5c39758f075d6975d559c4207598ad659f
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK доступний як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено каталог найуживаніших підшляхів, згрупованих за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані допоміжні підшляхи bundled-plugin також наведено там, але вони є деталлю
  реалізації, якщо лише сторінка документації явно не просуває їх.

  Посібник з розробки Plugin див. у [Огляд Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Підшлях                                  | Ключові експорти                                                                                                                                                             |
  | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                        | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                      |
  | `plugin-sdk/config-schema`               | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`              | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                     | Широкий сумісний barrel для застарілих тестів Plugin; для нових тестів розширень надавайте перевагу спеціалізованим тестовим підшляхам                                    |
  | `plugin-sdk/plugin-test-api`             | Мінімальний збирач моків `OpenClawPluginApi` для прямих модульних тестів реєстрації Plugin                                                                                  |
  | `plugin-sdk/agent-runtime-test-contracts` | Фікстури контрактів нативного адаптера agent-runtime для профілів автентифікації, пригнічення доставки, класифікації резервних сценаріїв, хуків інструментів, накладок промптів, схем і відновлення транскриптів |
  | `plugin-sdk/channel-test-helpers`        | Допоміжні засоби для тестування життєвого циклу облікового запису каналу, каталогу, send-config, мока runtime, хука, bundled channel entry, часової мітки envelope, відповіді на pairing і загальних контрактів каналу |
  | `plugin-sdk/channel-target-testing`      | Спільний набір тестів для випадків помилок під час визначення цілі каналу                                                                                                    |
  | `plugin-sdk/plugin-test-contracts`       | Допоміжні засоби для контрактів реєстрації Plugin, маніфесту пакета, публічного артефакту, runtime API, побічних ефектів імпорту та прямого імпорту                        |
  | `plugin-sdk/plugin-test-runtime`         | Фікстури runtime Plugin, реєстру, реєстрації провайдера, майстра налаштування та TaskFlow runtime для тестів                                                                |
  | `plugin-sdk/provider-test-contracts`     | Допоміжні засоби для контрактів runtime провайдера, автентифікації, виявлення, онбордингу, каталогу, медіаможливостей, політики повтору, realtime STT live-audio, web-search/fetch і майстра |
  | `plugin-sdk/provider-http-test-mocks`    | Opt-in моки HTTP/автентифікації для Vitest у тестах провайдерів, які використовують `plugin-sdk/provider-http`                                                             |
  | `plugin-sdk/test-env`                    | Фікстури тестового середовища, fetch/мережі, disposable HTTP server, вхідного запиту, live-тесту, тимчасової файлової системи та керування часом                           |
  | `plugin-sdk/test-fixtures`               | Загальні тестові фікстури для CLI, sandbox, skill, повідомлення агента, системної події, перезавантаження модуля, шляху bundled plugin, термінала, chunking, токена автентифікації та типізованого кейсу |
  | `plugin-sdk/test-node-mocks`             | Спеціалізовані допоміжні засоби для моків вбудованих модулів Node для використання у фабриках Vitest `vi.mock("node:*")`                                                   |
  | `plugin-sdk/migration`                   | Допоміжні засоби елементів провайдера міграції, як-от `createMigrationItem`, константи причин, маркери статусу елементів, допоміжні засоби редагування та `summarizeMigrationItems` |
  | `plugin-sdk/migration-runtime`           | Допоміжні засоби runtime міграції, як-от `copyMigrationFileItem` і `writeMigrationReport`                                                                                   |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт кореневої Zod-схеми `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, allowlist-промптів і побудови статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби конфігурації/контролю дій для кількох облікових записів, а також fallback-засоби облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації id облікового запису |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису + fallback до облікового запису за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби для списку облікових записів/дій облікового запису |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу та універсальний збирач |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації bundled OpenClaw channel лише для підтримуваних bundled Plugin |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий сумісний псевдонім для bundled-channel config schemas |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації користувацьких команд Telegram із fallback на bundled-contract |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби контролю авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, допоміжні засоби життєвого циклу/завершення потоку чернеток |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби для вхідного маршруту + побудови envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису та диспетчеризації вхідних даних |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-send-deps` | Легковаговий пошук залежностей надсилання вихідних даних для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби runtime для вихідної доставки, ідентичності, делегата надсилання, сесії, форматування та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу thread-binding і адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий збирач agent media payload |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби conversation/thread binding, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб snapshot конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби визначення group-policy у runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби snapshot/summary статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні prelude-експорти для channel plugin |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби для рішень щодо group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби авторизації/захисту direct-DM |
    | `plugin-sdk/interactive-runtime` | Семантичне представлення повідомлень, доставка та застарілі допоміжні засоби інтерактивних відповідей. Див. [Представлення повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Сумісний barrel для вхідного debounce, зіставлення згадок, допоміжних засобів mention-policy та envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби вхідного debounce |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби mention-policy, маркерів згадок і тексту згадок без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби форматування вхідного envelope |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту та форматування розташування каналу |
    | `plugin-sdk/channel-logging` | Допоміжні засоби логування каналу для відкинутих вхідних даних і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби дій із повідомленнями каналу, а також застарілі допоміжні засоби нативної схеми, збережені для сумісності Plugin |
    | `plugin-sdk/channel-route` | Спільні допоміжні засоби нормалізації маршрутів, визначення цілей на основі парсера, перетворення thread-id на рядок, dedupe/compact ключів маршруту, типів parsed-target, а також порівняння маршрутів/цілей |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору цілей; виклики порівняння маршрутів мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналу |
    | `plugin-sdk/channel-feedback` | Підключення feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-contract, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, а також типи цілей секретів |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки моделей у runtime |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад runtime LM Studio для стандартних параметрів локального сервера, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Кураторські допоміжні засоби налаштування локальних/self-hosted провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані допоміжні засоби налаштування self-hosted провайдерів, сумісних з OpenAI |
    | `plugin-sdk/cli-backend` | Стандартні параметри бекенда CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби визначення API-ключів у runtime для Plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу/запису профілю API-ключа, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний збирач auth-result для OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для Plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку env vars для автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні збирачі replay-policy, допоміжні засоби endpoint провайдера та нормалізації model-id, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Хук runtime для розширення каталогу провайдера та стики реєстру plugin-provider для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні засоби для HTTP/можливостей endpoint провайдера, HTTP-помилки провайдера та допоміжні засоби multipart form для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту config/selection для web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування провайдера web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби config/credential для web-search для провайдерів, яким не потрібне підключення enable Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту config/credential для web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` і setter/getter облікових даних в обмеженій області |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/runtime провайдера web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Нативні допоміжні засоби транспорту провайдера, як-от guarded fetch, перетворення транспортних повідомлень і потоки подій транспорту з можливістю запису |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби patch конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби process-local singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації групи та розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів, а також допоміжні засоби авторизації відправника |
    | `plugin-sdk/command-status` | Збирачі повідомлень для команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби визначення того, хто схвалює, і автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Нативні допоміжні засоби профілю/фільтра схвалення exec |
    | `plugin-sdk/approval-delivery-runtime` | Нативні адаптери можливостей/доставки схвалення |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб визначення Gateway для схвалення |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легковагові нативні допоміжні засоби завантаження адаптера схвалення для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби runtime для обробника схвалення; якщо достатньо, віддавайте перевагу вужчим стикам adapter/gateway |
    | `plugin-sdk/approval-native-runtime` | Нативні допоміжні засоби цілі схвалення + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді для схвалення exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload схвалення exec/plugin, нативні допоміжні засоби маршрутизації/runtime схвалення, а також структуровані допоміжні засоби відображення схвалення, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби тестування контрактів каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативні допоміжні засоби автентифікації команд, форматування меню динамічних аргументів і нативних session-target |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легковагові предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Допоміжні засоби нормалізації тіла команди та command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання secret-contract для поверхонь секретів channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби `coerceSecretRef` і типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби для довіри, DM gating, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів за сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби політики SSRF для allowlist хостів і приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої поверхні infra runtime |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, fetch із захистом SSRF, помилок SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору secret input |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби запиту/цілі Webhook і приведення raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби обмеження розміру body/timeout запиту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби для runtime/логування/резервного копіювання/встановлення Plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби для env runtime, logger, timeout, retry і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/параметрів за замовчуванням, розбору URL CDP і допоміжних засобів автентифікації browser-control |
    | `plugin-sdk/channel-runtime-context` | Загальні допоміжні засоби реєстрації та пошуку channel runtime-context |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби для команд/хуків/http/інтерактивних функцій Plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби конвеєра Webhook/внутрішніх хуків |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби lazy-імпорту/прив’язки runtime, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версії, виклику аргументів і lazy command-group |
    | `plugin-sdk/gateway-runtime` | Допоміжні засоби клієнта Gateway, CLI RPC Gateway, помилок протоколу Gateway і patch статусу каналу |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише для типів для форм конфігурації Plugin, як-от `OpenClawConfig` і типів конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку plugin-config у runtime, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної мутації конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби snapshot конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot` і setter-и test snapshot |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації назв/описів команд Telegram і перевірок дублікатів/конфліктів, навіть коли поверхня контракту bundled Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого text-runtime barrel |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби схвалення exec/plugin, збирачі approval-capability, допоміжні засоби auth/profile, нативні допоміжні засоби routing/runtime і форматування структурованого шляху відображення схвалення |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби runtime для inbound/reply, chunking, dispatch, Heartbeat, planner відповіді |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize відповіді та ярликів conversation |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби history відповідей для короткого вікна та маркери, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби chunking тексту/markdown |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сесій, session-key, updated-at і мутації сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/load/save сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів каталогів State/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби маршруту/ключа сесії/прив’язки облікового запису, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби summary статусу каналу/облікового запису, стандартні параметри runtime-state і допоміжні засоби метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби target resolver |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL з вхідних даних типу fetch/request |
    | `plugin-sdk/run-command` | Запускач команд із таймером і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Поширені читачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об’єктів результатів tool |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляху тимчасового завантаження |
    | `plugin-sdk/logging-core` | Допоміжні засоби логера підсистеми та редагування |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму та перетворення таблиць Markdown |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення моделі/сесії, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби визначення конфігурації talk provider |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису JSON state |
    | `plugin-sdk/file-lock` | Реентерабельні допоміжні засоби file-lock |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби кешу дедуплікації з дисковим backing |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби runtime/сесії ACP і reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Визначення прив’язки ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви schema конфігурації agent runtime |
    | `plugin-sdk/boolean-param` | Гнучкий читач булевих параметрів |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби визначення збігів небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби bootstrap пристрою та токена pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів passive-channel, status і ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді команди `/models`/провайдера |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби списку команд Skill |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/build/serialize нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих agent harnesses: типи harness, допоміжні засоби керування/переривання active-run, допоміжні засоби мосту tool OpenClaw, допоміжні засоби політики tool runtime-plan, класифікація результатів terminal, допоміжні засоби форматування/деталізації прогресу tool і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.A.I |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб process-local async lock для невеликих файлів runtime state |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеженої конкурентності async-задач |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби кешу дедуплікації в пам’яті |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб drain для вихідних pending-delivery |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечного шляху до локального файлу та media-source |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби подій і видимості Heartbeat |
    | `plugin-sdk/number-runtime` | Допоміжний засіб числового приведення |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечних токенів/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте спеціалізовані підшляхи runtime вище |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби прапорців, подій і trace-context діагностики |
    | `plugin-sdk/error-runtime` | Допоміжні засоби графа помилок, форматування, спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Допоміжні засоби wrapped fetch, proxy і pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch з урахуванням dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Читач обмеженого response-body без широкої media runtime surface |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки conversation без маршрутизації configured binding або сховищ pairing |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Визначення видимості контексту та фільтрація додаткового контексту без широких імпортів config/security |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення та нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і запуску retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогу/ідентичності/робочого простору агента |
    | `plugin-sdk/directory-runtime` | Запит/dedup каталогу на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби fetch/transform/store для медіа, а також збирачі media payload |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби media store, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби failover для генерації медіа, вибору кандидатів і повідомлень про відсутню модель |
    | `plugin-sdk/media-understanding` | Типи провайдера для розуміння медіа, а також орієнтовані на провайдера експорти допоміжних засобів для зображень/аудіо |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби для тексту/markdown/логування, як-от видалення видимого для помічника тексту, допоміжні засоби render/chunking/table для markdown, допоміжні засоби редагування, допоміжні засоби directive-tag і утиліти safe-text |
    | `plugin-sdk/text-chunking` | Допоміжний засіб chunking вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдера мовлення, а також орієнтовані на провайдера експорти директив, реєстру, валідації, сумісного з OpenAI збирача TTS і допоміжних засобів мовлення |
    | `plugin-sdk/speech-core` | Спільні експорти типів провайдера мовлення, реєстру, директив, нормалізації та допоміжних засобів мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдера realtime transcription, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдера realtime voice і допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи провайдера генерації зображень, а також допоміжні засоби image asset/data URL і сумісний з OpenAI збирач провайдера зображень |
    | `plugin-sdk/image-generation-core` | Спільні допоміжні засоби типів, failover, auth і реєстру для генерації зображень |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби failover, пошуку провайдера та розбору model-ref |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби failover, пошуку провайдера та розбору model-ref |
    | `plugin-sdk/webhook-targets` | Допоміжні засоби реєстру цілей Webhook і встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів Plugin SDK |
    | `plugin-sdk/testing` | Широкий сумісний barrel для застарілих тестів Plugin. Нові тести розширень мають імпортувати спеціалізовані підшляхи SDK, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний допоміжний засіб `createTestPluginApi` для прямих модульних тестів реєстрації Plugin без імпорту мостів допоміжних тестових засобів репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Фікстури контрактів нативного адаптера agent-runtime для тестів auth, delivery, fallback, tool-hook, prompt-overlay, schema і проєкції транскриптів |
    | `plugin-sdk/channel-test-helpers` | Орієнтовані на канали допоміжні засоби тестування для загальних контрактів actions/setup/status, перевірок каталогу, життєвого циклу запуску облікового запису, потоків send-config, моків runtime, проблем статусу, вихідної доставки та реєстрації хуків |
    | `plugin-sdk/channel-target-testing` | Спільний набір випадків помилок визначення цілі для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Допоміжні засоби контрактів пакета Plugin, реєстрації, публічного артефакту, прямого імпорту, runtime API і побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Допоміжні засоби контрактів runtime, auth, discovery, onboard, catalog, wizard, media capability, replay policy, realtime STT live-audio, web-search/fetch і stream для провайдерів |
    | `plugin-sdk/provider-http-test-mocks` | Opt-in моки HTTP/auth для Vitest у тестах провайдерів, які використовують `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Загальні фікстури захоплення runtime CLI, контексту sandbox, записувача skill, повідомлення агента, системної події, перезавантаження модуля, шляху bundled plugin, terminal-text, chunking, auth-token і типізованого кейсу |
    | `plugin-sdk/test-node-mocks` | Спеціалізовані допоміжні засоби моків вбудованих модулів Node для використання у фабриках Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня допоміжних засобів bundled memory-core для manager/config/file/CLI helperів |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексації/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний провайдер і загальні batch/remote helperи |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні helperи хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Helperи запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Helperи секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Helperи журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Helperи статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helperи runtime CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Helperи основного runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Helperи файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Vendor-neutral псевдонім для helperів основного runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Vendor-neutral псевдонім для helperів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Vendor-neutral псевдонім для helperів файлів/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні helperи managed-markdown для Plugin, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад runtime Active Memory для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Vendor-neutral псевдонім для helperів статусу хоста пам’яті |
    | `plugin-sdk/memory-lancedb` | Поверхня допоміжних засобів bundled memory-lancedb |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи bundled-helper">
    | Сімейство | Поточні підшляхи | Призначення |
    | --- | --- | --- |
    | Браузер | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Допоміжні засоби підтримки bundled browser plugin. `browser-profiles` експортує `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` і `ResolvedBrowserTabCleanupConfig` для нормалізованої форми `browser.tabCleanup`. `browser-support` лишається barrel сумісності. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Поверхня helperів/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Поверхня helperів/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Поверхня helperів bundled IRC |
    | Допоміжні засоби, специфічні для каналів | `plugin-sdk/googlechat`, `plugin-sdk/googlechat-runtime-shared`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu`, `plugin-sdk/feishu-conversation`, `plugin-sdk/feishu-setup`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/telegram-command-ui`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` | Застарілі стики сумісності/helperи bundled channel. Нові Plugin мають імпортувати загальні підшляхи SDK або локальні barrel-и Plugin. |
    | Допоміжні засоби, специфічні для auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/memory-core`, `plugin-sdk/memory-lancedb`, `plugin-sdk/opencode`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Стики helperів bundled feature/plugin; `plugin-sdk/github-copilot-token` наразі експортує `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` і `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
- [Налаштування Plugin SDK](/uk/plugins/sdk-setup)
- [Створення Plugin](/uk/plugins/building-plugins)
