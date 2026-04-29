---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту в Plugin
    - Аудит підшляхів вбудованих Plugin і допоміжних інтерфейсів
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розміщені, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-04-29T11:22:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb6ab50997d3f8cd78c1a70924e7349d577e70af7061fd0d43d4836830a90e9a
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK плагінів надається як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
  На цій сторінці наведено часто використовувані підшляхи, згруповані за призначенням. Згенерований
  повний список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
  зарезервовані підшляхи допоміжних засобів вбудованих плагінів також є там, але вони є деталлю
  реалізації, якщо сторінка документації явно не робить їх рекомендованими. Супровідники можуть перевіряти активні
  зарезервовані підшляхи допоміжних засобів за допомогою `pnpm plugins:boundary-report:summary`; невикористані
  зарезервовані допоміжні експорти спричиняють збій звіту CI, а не залишаються в публічному SDK
  як неактивний борг сумісності.

  Посібник зі створення плагінів див. у [огляді Plugin SDK](/uk/plugins/sdk-overview).

  ## Точка входу Plugin

  | Підшлях                                   | Ключові експорти                                                                                                                                                                  |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Широкий barrel сумісності для застарілих тестів плагінів; для нових тестів розширень надавайте перевагу сфокусованим тестовим підшляхам                                                                     |
  | `plugin-sdk/plugin-test-api`              | Мінімальний builder моків `OpenClawPluginApi` для модульних тестів прямої реєстрації плагінів                                                                                           |
  | `plugin-sdk/agent-runtime-test-contracts` | Фікстури контрактів нативного адаптера agent-runtime для профілів автентифікації, пригнічення доставки, класифікації fallback, хуків інструментів, накладень промптів, схем і відновлення транскриптів |
  | `plugin-sdk/channel-test-helpers`         | Допоміжні засоби тестування життєвого циклу акаунта каналу, директорії, конфігурації надсилання, мока runtime, хука, запису вбудованого каналу, часової позначки envelope, відповіді pairing і загальних контрактів каналів   |
  | `plugin-sdk/channel-target-testing`       | Спільний набір тестів випадків помилок розв’язання цілі каналу                                                                                                                       |
  | `plugin-sdk/plugin-test-contracts`        | Допоміжні засоби контрактів реєстрації плагіна, маніфесту пакета, публічного артефакту, runtime API, побічного ефекту імпорту та прямого імпорту                                                  |
  | `plugin-sdk/plugin-test-runtime`          | Фікстури runtime плагіна, реєстру, реєстрації провайдера, майстра налаштування та runtime TaskFlow для тестів                                                                      |
  | `plugin-sdk/provider-test-contracts`      | Допоміжні засоби контрактів runtime провайдера, автентифікації, виявлення, onboard, каталогу, медіаможливостей, політики replay, realtime STT live-audio, web-search/fetch і майстра                 |
  | `plugin-sdk/provider-http-test-mocks`     | Опціональні HTTP/auth моки Vitest для тестів провайдерів, які перевіряють `plugin-sdk/provider-http`                                                                                    |
  | `plugin-sdk/test-env`                     | Фікстури тестового середовища, fetch/network, одноразового HTTP-сервера, вхідного запиту, live-test, тимчасової файлової системи та керування часом                                        |
  | `plugin-sdk/test-fixtures`                | Загальні фікстури тестів CLI, sandbox, skill, agent-message, system-event, перезавантаження модуля, шляху вбудованого плагіна, terminal, chunking, auth-token і typed-case                   |
  | `plugin-sdk/test-node-mocks`              | Сфокусовані допоміжні засоби моків вбудованих модулів Node для використання у фабриках Vitest `vi.mock("node:*")`                                                                                        |
  | `plugin-sdk/migration`                    | Допоміжні засоби елементів провайдера міграції, як-от `createMigrationItem`, константи причин, маркери статусу елементів, допоміжні засоби редагування та `summarizeMigrationItems`                       |
  | `plugin-sdk/migration-runtime`            | Допоміжні засоби runtime міграції, як-от `copyMigrationFileItem` і `writeMigrationReport`                                                                                         |

  <AccordionGroup>
  <Accordion title="Підшляхи каналів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Експорт Zod-схеми кореневого `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, промпти allowlist, builder-и статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби конфігурації кількох акаунтів/action-gate, допоміжні засоби fallback для акаунта за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку акаунта + default-fallback |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби account-list/account-action |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу та загальний builder |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації каналів OpenClaw для підтримуваних вбудованих плагінів лише |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий псевдонім сумісності для схем конфігурації bundled-channel |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/валідації кастомних команд Telegram з fallback вбудованого контракту |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби gate авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, допоміжні засоби життєвого циклу/фіналізації draft stream |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби вхідного маршруту + builder envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Спільні допоміжні засоби запису та dispatch вхідних записів |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби парсингу/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-send-deps` | Легкий пошук залежностей вихідного надсилання для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби планування вихідної доставки, ідентичності, делегата надсилання, сесії, форматування та payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації poll |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу thread-binding та адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий builder payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби conversation/thread binding, pairing і configured-binding |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб snapshot runtime-конфігурації |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби розв’язання runtime group-policy |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби snapshot/summary статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви channel config-schema |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти prelude для плагіна каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби ухвалення рішень group-access |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби auth/guard для direct-DM |
    | `plugin-sdk/discord` | Застарілий фасад сумісності Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної сумісності власника; нові плагіни мають використовувати загальні підшляхи SDK каналів |
    | `plugin-sdk/telegram-account` | Застарілий фасад сумісності розв’язання акаунта Telegram для відстежуваної сумісності власника; нові плагіни мають використовувати інжектовані runtime helpers або загальні підшляхи SDK каналів |
    | `plugin-sdk/interactive-runtime` | Семантичне подання повідомлень, доставка та застарілі допоміжні засоби інтерактивної відповіді. Див. [Подання повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для вхідного debounce, зіставлення mention, допоміжних засобів mention-policy та envelope |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби вхідного debounce |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби mention-policy, маркера mention і тексту mention без ширшої поверхні inbound runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби форматування вхідного envelope |
    | `plugin-sdk/channel-location` | Контекст розташування каналу та допоміжні засоби форматування |
    | `plugin-sdk/channel-logging` | Допоміжні засоби логування каналу для вхідних drop і помилок typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результату відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби message-action каналу, а також застарілі допоміжні засоби нативних схем, збережені для сумісності плагінів |
    | `plugin-sdk/channel-route` | Спільна нормалізація маршрутів, розв’язання цілей через парсер, приведення thread-id до рядка, dedupe/compact ключі маршрутів, типи parsed-target і допоміжні засоби порівняння route/target |
    | `plugin-sdk/channel-targets` | Допоміжні засоби парсингу цілей; виклики порівняння маршрутів мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контрактів каналів |
    | `plugin-sdk/channel-feedback` | Зв’язування feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби secret-contract, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` і типи цілей secret |
  </Accordion>

  <Accordion title="Підшляхи постачальників">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад постачальника LM Studio для налаштування, виявлення каталогу й підготовки моделей під час виконання |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний фасад часу виконання LM Studio для стандартних параметрів локального сервера, виявлення моделей, заголовків запитів і допоміжних засобів для завантажених моделей |
    | `plugin-sdk/provider-setup` | Відібрані допоміжні засоби налаштування локальних/самостійно розміщених постачальників |
    | `plugin-sdk/self-hosted-provider-setup` | Спеціалізовані допоміжні засоби налаштування OpenAI-сумісних самостійно розміщених постачальників |
    | `plugin-sdk/cli-backend` | Стандартні параметри бекенду CLI + константи сторожового процесу |
    | `plugin-sdk/provider-auth-runtime` | Допоміжні засоби розв’язання API-ключів під час виконання для Plugin постачальників |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні засоби онбордингу API-ключів/запису профілю, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний конструктор результату автентифікації OAuth |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні засоби інтерактивного входу для Plugin постачальників |
    | `plugin-sdk/provider-env-vars` | Допоміжні засоби пошуку змінних середовища автентифікації постачальника |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні конструктори політик повторного відтворення, допоміжні засоби кінцевих точок постачальника та допоміжні засоби нормалізації ID моделей, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Хук часу виконання для доповнення каталогу постачальників і шви реєстру Plugin-постачальників для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Універсальні допоміжні засоби можливостей HTTP/кінцевих точок постачальників, HTTP-помилки постачальників і допоміжні засоби multipart-форм для транскрипції аудіо |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні засоби контракту налаштування/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні засоби реєстрації/кешування постачальника web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні засоби налаштування/облікових даних web-search для постачальників, яким не потрібне підключення вмикання Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні засоби контракту налаштування/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, і обмежені за областю сетери/гетери облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні засоби реєстрації/кешування/часу виконання постачальника web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схем Gemini + діагностика, а також допоміжні засоби сумісності xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` та подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи обгорток потоків і спільні допоміжні засоби обгорток Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні засоби нативного транспорту постачальників, як-от захищений fetch, перетворення транспортних повідомлень і придатні для запису потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні засоби патчів конфігурації онбордингу |
    | `plugin-sdk/global-singleton` | Допоміжні засоби локальних для процесу singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузькі допоміжні засоби режиму активації групи та розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні засоби реєстру команд, зокрема форматування меню динамічних аргументів, допоміжні засоби авторизації відправників |
    | `plugin-sdk/command-status` | Конструктори повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні засоби розв’язання затверджувача та автентифікації дій у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні засоби нативного профілю/фільтра затвердження exec |
    | `plugin-sdk/approval-delivery-runtime` | Нативні адаптери можливостей/доставки затверджень |
    | `plugin-sdk/approval-gateway-runtime` | Спільний допоміжний засіб розв’язання Gateway затверджень |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі допоміжні засоби завантаження нативних адаптерів затверджень для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші допоміжні засоби часу виконання обробника затверджень; віддавайте перевагу вужчим швам адаптера/Gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні засоби нативної цілі затвердження + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні засоби payload відповіді затвердження exec/Plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби payload затвердження exec/Plugin, допоміжні засоби маршрутизації/часу виконання нативних затверджень і допоміжні засоби структурованого відображення затверджень, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні засоби скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні засоби контрактних тестів каналів без широкого тестового бареля |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування меню динамічних аргументів і допоміжні засоби нативної цілі сеансу |
    | `plugin-sdk/command-detection` | Спільні допоміжні засоби виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати командного тексту для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Нормалізація тіла команди й допоміжні засоби поверхні команд |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби збирання контрактів секретів для поверхонь секретів каналу/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі допоміжні засоби типізації `coerceSecretRef` і SecretRef для розбору контрактів секретів/конфігурації |
    | `plugin-sdk/security-runtime` | Спільні допоміжні засоби довіри, обмеження DM, зовнішнього вмісту, редагування чутливого тексту, порівняння секретів за сталий час і збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні засоби allowlist хостів і політики SSRF для приватних мереж |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні засоби pinned-dispatcher без широкої інфраструктурної поверхні часу виконання |
    | `plugin-sdk/ssrf-runtime` | Допоміжні засоби pinned-dispatcher, SSRF-захищеного fetch, помилки SSRF і політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні засоби розбору введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні засоби Webhook-запитів/цілей і приведення сирого websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні засоби розміру/тайм-ауту тіла запиту |
  </Accordion>

  <Accordion title="Підшляхи середовища виконання та сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі допоміжні засоби середовища виконання/логування/резервного копіювання/встановлення Plugin |
    | `plugin-sdk/runtime-env` | Вузькі допоміжні засоби env середовища виконання, logger, timeout, retry і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових значень, розбору CDP URL і допоміжних засобів автентифікації керування браузером |
    | `plugin-sdk/channel-runtime-context` | Допоміжні засоби реєстрації та пошуку загального runtime-context каналу |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні допоміжні засоби команд/хуків/http/інтерактивності Plugin |
    | `plugin-sdk/hook-runtime` | Спільні допоміжні засоби Webhook/внутрішнього конвеєра хуків |
    | `plugin-sdk/lazy-runtime` | Допоміжні засоби лінивого імпорту/прив’язки середовища виконання, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Допоміжні засоби виконання процесів |
    | `plugin-sdk/cli-runtime` | Допоміжні засоби форматування CLI, очікування, версії, виклику аргументів і лінивих груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, RPC CLI gateway, помилки протоколу gateway і допоміжні засоби патчів статусу каналу |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише з типами для форм конфігурації Plugin, як-от `OpenClawConfig` і типи конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Допоміжні засоби пошуку конфігурації Plugin у середовищі виконання, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Допоміжні засоби транзакційної зміни конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжні засоби знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot`, і сетери тестових знімків |
    | `plugin-sdk/telegram-command-config` | Нормалізація назви/опису команди Telegram і перевірки дублікатів/конфліктів, навіть коли вбудована контрактна поверхня Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Допоміжні засоби схвалення exec/Plugin, збирачі можливостей схвалення, допоміжні засоби auth/profile, допоміжні засоби нативного маршрутизування/середовища виконання та форматування шляху структурованого відображення схвалення |
    | `plugin-sdk/reply-runtime` | Спільні допоміжні засоби середовища виконання вхідних повідомлень/відповідей, поділ на фрагменти, dispatch, Heartbeat, планувальник відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі допоміжні засоби dispatch/finalize відповіді та міток розмов |
    | `plugin-sdk/reply-history` | Спільні допоміжні засоби й маркери історії відповідей у короткому вікні, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі допоміжні засоби поділу тексту/markdown на фрагменти |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби шляху сховища сеансів, session-key, updated-at і зміни сховища |
    | `plugin-sdk/cron-store-runtime` | Допоміжні засоби шляху/load/save сховища Cron |
    | `plugin-sdk/state-paths` | Допоміжні засоби шляхів до каталогів стану/OAuth |
    | `plugin-sdk/routing` | Допоміжні засоби маршруту/session-key/прив’язки облікового запису, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні допоміжні засоби зведення статусу каналу/облікового запису, типові значення runtime-state і допоміжні засоби метаданих issue |
    | `plugin-sdk/target-resolver-runtime` | Спільні допоміжні засоби resolver цілей |
    | `plugin-sdk/string-normalization-runtime` | Допоміжні засоби нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягувати рядкові URL з вхідних даних, подібних до fetch/request |
    | `plugin-sdk/run-command` | Запускач команд з обмеженням часу й нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні читачі параметрів tool/CLI |
    | `plugin-sdk/tool-payload` | Витягувати нормалізовані payload з об’єктів результату tool |
    | `plugin-sdk/tool-send` | Витягувати канонічні поля цілі надсилання з аргументів tool |
    | `plugin-sdk/temp-path` | Спільні допоміжні засоби шляхів тимчасових завантажень |
    | `plugin-sdk/logging-core` | Logger підсистеми та допоміжні засоби редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Допоміжні засоби режиму та перетворення таблиць Markdown |
    | `plugin-sdk/model-session-runtime` | Допоміжні засоби перевизначення моделі/сеансу, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Допоміжні засоби розв’язання конфігурації провайдера Talk |
    | `plugin-sdk/json-store` | Невеликі допоміжні засоби читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Допоміжні засоби реентерабельного блокування файлів |
    | `plugin-sdk/persistent-dedupe` | Допоміжні засоби дискового кешу дедуплікації |
    | `plugin-sdk/acp-runtime` | Допоміжні засоби ACP середовища виконання/сеансу та reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Полегшені допоміжні засоби реєстрації backend ACP і reply-dispatch для Plugin, завантажених під час запуску |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання прив’язки ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви config-schema середовища виконання агента |
    | `plugin-sdk/boolean-param` | Нестрогий читач булевого параметра |
    | `plugin-sdk/dangerous-name-runtime` | Допоміжні засоби розв’язання зіставлення небезпечних назв |
    | `plugin-sdk/device-bootstrap` | Допоміжні засоби початкового налаштування пристрою та токена спарювання |
    | `plugin-sdk/extension-shared` | Спільні примітиви допоміжних засобів пасивного каналу, статусу й ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Допоміжні засоби відповіді команди/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Допоміжні засоби переліку команд Skills |
    | `plugin-sdk/native-command-registry` | Допоміжні засоби реєстру/build/serialize нативних команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня довірених Plugin для низькорівневих harness агентів: типи harness, допоміжні засоби steer/abort активного запуску, допоміжні засоби bridge tool OpenClaw, допоміжні засоби політики tool runtime-plan, класифікація результатів термінала, допоміжні засоби форматування/деталізації прогресу tool і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Допоміжні засоби виявлення endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Допоміжний засіб async lock, локальний для процесу, для малих файлів стану середовища виконання |
    | `plugin-sdk/channel-activity-runtime` | Допоміжний засіб телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Допоміжний засіб обмеженої конкурентності асинхронних завдань |
    | `plugin-sdk/dedupe-runtime` | Допоміжні засоби кешу дедуплікації в пам’яті |
    | `plugin-sdk/delivery-queue-runtime` | Допоміжний засіб drain вихідних очікуваних доставок |
    | `plugin-sdk/file-access-runtime` | Допоміжні засоби безпечних шляхів до локальних файлів і media-source |
    | `plugin-sdk/heartbeat-runtime` | Допоміжні засоби подій Heartbeat і видимості |
    | `plugin-sdk/number-runtime` | Допоміжний засіб числового приведення |
    | `plugin-sdk/secure-random-runtime` | Допоміжні засоби безпечного токена/UUID |
    | `plugin-sdk/system-event-runtime` | Допоміжні засоби черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Допоміжний засіб очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте сфокусовані підшляхи середовища виконання вище |
    | `plugin-sdk/collection-runtime` | Невеликі допоміжні засоби обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Допоміжні засоби діагностичного прапорця, події та trace-context |
    | `plugin-sdk/error-runtime` | Граф помилок, форматування, спільні допоміжні засоби класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy, опція EnvHttpProxyAgent і допоміжні засоби pinned lookup |
    | `plugin-sdk/runtime-fetch` | Dispatcher-aware fetch середовища виконання без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Обмежений reader response-body без широкої медійної поверхні середовища виконання |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки розмови без налаштованого маршрутизування прив’язок або сховищ спарювання |
    | `plugin-sdk/session-store-runtime` | Допоміжні засоби session-store без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Розв’язання видимості контексту та фільтрація додаткового контексту без широких імпортів конфігурації/безпеки |
    | `plugin-sdk/string-coerce-runtime` | Вузькі допоміжні засоби приведення й нормалізації primitive record/string без імпортів markdown/logging |
    | `plugin-sdk/host-runtime` | Допоміжні засоби нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Допоміжні засоби конфігурації retry і запуску retry |
    | `plugin-sdk/agent-runtime` | Допоміжні засоби каталогу/ідентичності/workspace агента |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація каталогу на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні допоміжні засоби для отримання/перетворення/зберігання медіа, визначення розмірів відео на основі ffprobe і побудови медіа-навантажень |
    | `plugin-sdk/media-store` | Вузькі допоміжні засоби медіасховища, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні допоміжні засоби резервного перемикання для генерації медіа, вибір кандидатів і повідомлення про відсутні моделі |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти допоміжних засобів для зображень/аудіо, призначені для провайдерів |
    | `plugin-sdk/text-runtime` | Спільні допоміжні засоби для тексту/Markdown/логування, як-от видалення видимого для асистента тексту, допоміжні засоби рендерингу/фрагментації/таблиць Markdown, допоміжні засоби редагування, допоміжні засоби тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Допоміжний засіб фрагментації вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдерів мовлення, а також експорти директив, реєстру, валідації, побудовника TTS, сумісного з OpenAI, і допоміжних засобів мовлення, призначені для провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи провайдерів мовлення, реєстр, директиви, нормалізація й експорти допоміжних засобів мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, допоміжні засоби реєстру та спільний допоміжний засіб сесії WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та допоміжні засоби реєстру |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень, а також допоміжні засоби URL для ресурсів/даних зображень і побудовник провайдера зображень, сумісний з OpenAI |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, резервне перемикання, автентифікація та допоміжні засоби реєстру |
    | `plugin-sdk/music-generation` | Типи провайдера/запиту/результату генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, допоміжні засоби резервного перемикання, пошук провайдера та розбір model-ref |
    | `plugin-sdk/video-generation` | Типи провайдера/запиту/результату генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, допоміжні засоби резервного перемикання, пошук провайдера та розбір model-ref |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і допоміжні засоби встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Допоміжні засоби нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні допоміжні засоби завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів SDK plugin |
    | `plugin-sdk/testing` | Широкий barrel сумісності для застарілих тестів plugin. Нові тести plugin мають натомість імпортувати сфокусовані підшляхи SDK, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний допоміжний засіб `createTestPluginApi` для unit-тестів прямої реєстрації plugin без імпорту мостів тестових допоміжних засобів репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Нативні фікстури контрактів адаптера runtime агента для тестів автентифікації, доставки, fallback, хуків інструментів, prompt-overlay, схеми та проєкції transcript |
    | `plugin-sdk/channel-test-helpers` | Орієнтовані на канали тестові допоміжні засоби для generic контрактів дій/налаштування/статусу, перевірок каталогів, життєвого циклу запуску облікового запису, threading send-config, runtime-моків, проблем статусу, вихідної доставки та реєстрації хуків |
    | `plugin-sdk/channel-target-testing` | Спільний набір випадків помилок розв’язання цілі для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Допоміжні засоби контрактів пакета plugin, реєстрації, публічного артефакту, прямого імпорту, runtime API та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Допоміжні засоби контрактів runtime провайдера, автентифікації, виявлення, onboard, каталогу, майстра, медіаможливостей, політики replay, realtime STT live-audio, web-search/fetch і stream |
    | `plugin-sdk/provider-http-test-mocks` | Опціональні HTTP/auth моки Vitest для тестів провайдера, що виконують `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Generic фікстури захоплення CLI runtime, контексту sandbox, writer для skill, agent-message, system-event, перезавантаження модуля, шляху до вбудованого plugin, terminal-text, chunking, auth-token і typed-case |
    | `plugin-sdk/test-node-mocks` | Сфокусовані допоміжні засоби моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня вбудованих допоміжних засобів memory-core для допоміжних засобів manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад runtime індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти foundation engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти embedding хоста пам’яті, доступ до реєстру, локальний провайдер і generic batch/remote допоміжні засоби |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти QMD engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти storage engine хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні допоміжні засоби хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Допоміжні засоби запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Допоміжні засоби секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Допоміжні засоби журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Допоміжні засоби статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Допоміжні засоби CLI runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Допоміжні засоби core runtime хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Допоміжні засоби file/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний щодо постачальника alias для допоміжних засобів core runtime хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо постачальника alias для допоміжних засобів журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний щодо постачальника alias для допоміжних засобів file/runtime хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні допоміжні засоби managed-markdown для plugin, суміжних із пам’яттю |
    | `plugin-sdk/memory-host-search` | Фасад runtime активної пам’яті для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний щодо постачальника alias для допоміжних засобів статусу хоста пам’яті |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи вбудованих допоміжних засобів">
    Наразі немає зарезервованих підшляхів SDK для вбудованих допоміжних засобів. Специфічні для власника
    допоміжні засоби розміщуються всередині пакета plugin власника, а повторно використовувані контракти хоста
    використовують generic підшляхи SDK, як-от `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд SDK plugin](/uk/plugins/sdk-overview)
- [Налаштування SDK plugin](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
