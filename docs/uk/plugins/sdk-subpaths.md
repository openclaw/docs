---
read_when:
    - Вибір правильного підшляху plugin-sdk для імпорту Plugin
    - Аудит підшляхів вбудованих Plugin і допоміжних інтерфейсів
summary: 'Каталог підшляхів Plugin SDK: які імпорти де розташовані, згруповано за областями'
title: Підшляхи Plugin SDK
x-i18n:
    generated_at: "2026-05-06T01:36:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98b16cd3fcd6babc64df20ad4e679c35553fc21894617f30907bbf0e579a4d89
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin відкрито як набір вузьких підшляхів у `openclaw/plugin-sdk/`.
На цій сторінці наведено поширені підшляхи, згруповані за призначенням. Згенерований
повний список із 200+ підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`;
зарезервовані допоміжні підшляхи для вбудованих Plugin також є там, але вони є деталями
реалізації, якщо сторінка документації явно не робить їх публічними. Мейнтейнери можуть перевіряти активні
зарезервовані допоміжні підшляхи за допомогою `pnpm plugins:boundary-report:summary`; невикористані
зарезервовані допоміжні експорти провалюють звіт CI замість того, щоб залишатися в публічному SDK
як неактивний борг сумісності.

Посібник зі створення Plugin див. у [Огляд SDK Plugin](/uk/plugins/sdk-overview).

## Точка входу Plugin

| Підшлях                                  | Ключові експорти                                                                                                                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
| `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
| `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
| `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
| `plugin-sdk/testing`                      | Широкий сумісний barrel для застарілих тестів Plugin; для нових тестів розширень віддавайте перевагу спеціалізованим тестовим підшляхам                                    |
| `plugin-sdk/plugin-test-api`              | Мінімальний побудовник mock `OpenClawPluginApi` для unit-тестів прямої реєстрації Plugin                                                                                     |
| `plugin-sdk/agent-runtime-test-contracts` | Фікстури контрактів нативного адаптера agent-runtime для профілів автентифікації, приглушення доставки, класифікації fallback, hook-ів інструментів, накладень промптів, схем і відновлення транскрипту |
| `plugin-sdk/channel-test-helpers`         | Допоміжні засоби тестування життєвого циклу облікового запису каналу, каталогу, send-config, mock runtime, hook, точки входу вбудованого каналу, timestamp envelope, відповіді pairing і загальних контрактів каналу |
| `plugin-sdk/channel-target-testing`       | Спільний набір тестів для випадків помилок визначення цілі каналу                                                                                                           |
| `plugin-sdk/plugin-test-contracts`        | Допоміжні засоби для контрактів реєстрації Plugin, маніфеста пакета, публічного артефакта, runtime API, побічного ефекту імпорту та прямого імпорту                         |
| `plugin-sdk/plugin-test-runtime`          | Фікстури runtime Plugin, реєстру, реєстрації провайдера, setup-wizard і runtime task-flow для тестів                                                                         |
| `plugin-sdk/provider-test-contracts`      | Допоміжні засоби контрактів runtime провайдера, автентифікації, discovery, onboarding, каталогу, можливостей медіа, політики replay, realtime STT live-audio, web-search/fetch і wizard |
| `plugin-sdk/provider-http-test-mocks`     | Необов’язкові HTTP/auth mock-и Vitest для тестів провайдера, які перевіряють `plugin-sdk/provider-http`                                                                      |
| `plugin-sdk/test-env`                     | Фікстури тестового середовища, fetch/network, одноразового HTTP-сервера, вхідного запиту, live-test, тимчасової файлової системи та керування часом                         |
| `plugin-sdk/test-fixtures`                | Загальні фікстури тестів CLI, sandbox, skill, agent-message, system-event, перезавантаження модуля, шляху вбудованого Plugin, термінала, chunking, auth-token і typed-case  |
| `plugin-sdk/test-node-mocks`              | Спеціалізовані допоміжні засоби mock для вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")`                                               |
| `plugin-sdk/migration`                    | Допоміжні засоби елементів провайдера міграції, як-от `createMigrationItem`, константи причин, маркери статусу елементів, засоби редагування чутливих даних і `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime`            | Допоміжні засоби міграції runtime, як-от `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` і `writeMigrationReport`                                                |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Кореневий експорт схеми `openclaw.json` Zod (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, а також `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Спільні допоміжні засоби майстра налаштування, запити allowlist, побудовники статусу налаштування |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Допоміжні засоби конфігурації кількох облікових записів/шлюзу дій, допоміжні засоби резервного переходу до облікового запису за замовчуванням |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, допоміжні засоби нормалізації account-id |
    | `plugin-sdk/account-resolution` | Допоміжні засоби пошуку облікового запису та резервного переходу за замовчуванням |
    | `plugin-sdk/account-helpers` | Вузькі допоміжні засоби списку облікових записів/дій з обліковим записом |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Допоміжні засоби застарілого конвеєра відповідей. Новий код конвеєра відповідей каналу має використовувати `createChannelMessageReplyPipeline` і `resolveChannelMessageSourceReplyDeliveryMode` з `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Спільні примітиви схеми конфігурації каналу, а також побудовники Zod і прямі JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Схеми конфігурації каналів OpenClaw у комплекті лише для підтримуваних плагінів у комплекті |
    | `plugin-sdk/channel-config-schema-legacy` | Застарілий псевдонім сумісності для схем конфігурації каналів у комплекті |
    | `plugin-sdk/telegram-command-config` | Допоміжні засоби нормалізації/перевірки користувацьких команд Telegram із резервним переходом до контракту в комплекті |
    | `plugin-sdk/command-gating` | Вузькі допоміжні засоби шлюзу авторизації команд |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` і допоміжні засоби життєвого циклу застарілого потоку чернеток. Новий код фіналізації попереднього перегляду має використовувати `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Недорогі допоміжні засоби контракту життєвого циклу повідомлень, як-от `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, фасади сумісності, виведення можливості durable-final, допоміжні засоби підтвердження можливостей для надсилання/отримання/побічних ефектів, `MessageReceiveContext`, підтвердження політики receive ack, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, підтвердження можливостей live-preview і live-finalizer, стан надійного відновлення, `RenderedMessageBatch`, типи отримання повідомлень і допоміжні засоби ідентифікаторів отримання. Див. [API повідомлень каналу](/uk/plugins/sdk-channel-message). Застарілий `createChannelTurnReplyPipeline` залишається лише для диспетчерів сумісності. |
    | `plugin-sdk/channel-message-runtime` | Допоміжні засоби доставлення під час виконання, які можуть завантажувати вихідне доставлення, зокрема `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, `withDurableMessageSendContext`, `dispatchChannelMessageReplyWithBase` і `recordChannelMessageReplyDispatch`. Використовуйте з runtime-модулів моніторингу/надсилання, а не з гарячих файлів початкового завантаження плагіна. |
    | `plugin-sdk/inbound-envelope` | Спільні допоміжні засоби вхідного маршруту та побудовника конвертів |
    | `plugin-sdk/inbound-reply-dispatch` | Застарілі спільні допоміжні засоби запису й диспетчеризації вхідних даних, предикати видимої/фінальної диспетчеризації та застаріла сумісність `deliverDurableInboundReplyPayload` для підготовлених диспетчерів каналів. Новий код отримання/диспетчеризації каналу має імпортувати допоміжні засоби життєвого циклу runtime з `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Допоміжні засоби розбору/зіставлення цілей |
    | `plugin-sdk/outbound-media` | Спільні допоміжні засоби завантаження вихідних медіа |
    | `plugin-sdk/outbound-send-deps` | Легковаговий пошук залежностей вихідного надсилання для адаптерів каналів |
    | `plugin-sdk/outbound-runtime` | Допоміжні засоби вихідного доставлення, ідентичності, делегата надсилання, сеансу, форматування та планування payload |
    | `plugin-sdk/poll-runtime` | Вузькі допоміжні засоби нормалізації опитувань |
    | `plugin-sdk/thread-bindings-runtime` | Допоміжні засоби життєвого циклу прив’язування потоків і адаптера |
    | `plugin-sdk/agent-media-payload` | Застарілий побудовник payload медіа агента |
    | `plugin-sdk/conversation-runtime` | Допоміжні засоби прив’язування, сполучення та налаштованого прив’язування розмов/потоків |
    | `plugin-sdk/runtime-config-snapshot` | Допоміжний засіб знімка конфігурації runtime |
    | `plugin-sdk/runtime-group-policy` | Допоміжні засоби розв’язання групової політики runtime |
    | `plugin-sdk/channel-status` | Спільні допоміжні засоби знімка/зведення статусу каналу |
    | `plugin-sdk/channel-config-primitives` | Вузькі примітиви схеми конфігурації каналу |
    | `plugin-sdk/channel-config-writes` | Допоміжні засоби авторизації запису конфігурації каналу |
    | `plugin-sdk/channel-plugin-common` | Спільні експорти прелюдії плагіна каналу |
    | `plugin-sdk/allowlist-config-edit` | Допоміжні засоби редагування/читання конфігурації allowlist |
    | `plugin-sdk/group-access` | Спільні допоміжні засоби ухвалення рішень щодо доступу груп |
    | `plugin-sdk/direct-dm` | Спільні допоміжні засоби auth/guard для direct-DM |
    | `plugin-sdk/discord` | Застарілий фасад сумісності Discord для опублікованого `@openclaw/discord@2026.3.13` і відстежуваної сумісності власника; нові плагіни мають використовувати загальні підшляхи SDK каналів |
    | `plugin-sdk/telegram-account` | Застарілий фасад сумісності розв’язання облікових записів Telegram для відстежуваної сумісності власника; нові плагіни мають використовувати інжектовані runtime-допоміжні засоби або загальні підшляхи SDK каналів |
    | `plugin-sdk/zalouser` | Застарілий фасад сумісності Zalo Personal для опублікованих пакетів Lark/Zalo, які досі імпортують авторизацію команд відправника; нові плагіни мають використовувати `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Семантичні допоміжні засоби подання повідомлень, доставлення та застарілих інтерактивних відповідей. Див. [Подання повідомлень](/uk/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel сумісності для вхідного debounce, зіставлення згадок, допоміжних засобів політики згадок і допоміжних засобів конвертів |
    | `plugin-sdk/channel-inbound-debounce` | Вузькі допоміжні засоби вхідного debounce |
    | `plugin-sdk/channel-mention-gating` | Вузькі допоміжні засоби політики згадок, маркера згадки й тексту згадки без ширшої поверхні вхідного runtime |
    | `plugin-sdk/channel-envelope` | Вузькі допоміжні засоби форматування вхідного конверта |
    | `plugin-sdk/channel-location` | Допоміжні засоби контексту розташування каналу та форматування |
    | `plugin-sdk/channel-logging` | Допоміжні засоби журналювання каналу для відкидання вхідних даних і збоїв typing/ack |
    | `plugin-sdk/channel-send-result` | Типи результатів відповіді |
    | `plugin-sdk/channel-actions` | Допоміжні засоби дій із повідомленнями каналу, а також застарілі допоміжні засоби native schema, збережені для сумісності плагінів |
    | `plugin-sdk/channel-route` | Спільна нормалізація маршрутів, кероване парсером розв’язання цілей, перетворення thread-id на рядок, ключі маршрутів для dedupe/compact, типи розібраних цілей і допоміжні засоби порівняння маршрутів/цілей |
    | `plugin-sdk/channel-targets` | Допоміжні засоби розбору цілей; виклики порівняння маршрутів мають використовувати `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Типи контракту каналу |
    | `plugin-sdk/channel-feedback` | Зв’язування feedback/reaction |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні засоби контракту секретів, як-от `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, і типи цілей секретів |
  </Accordion>

  <Accordion title="Підшляхи провайдерів">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Підтримуваний фасад провайдера LM Studio для налаштування, виявлення каталогу та підготовки runtime-моделі |
    | `plugin-sdk/lmstudio-runtime` | Підтримуваний runtime-фасад LM Studio для локальних стандартних параметрів сервера, виявлення моделей, заголовків запитів і допоміжних функцій завантажених моделей |
    | `plugin-sdk/provider-setup` | Добірні допоміжні функції налаштування локальних/саморозміщених провайдерів |
    | `plugin-sdk/self-hosted-provider-setup` | Сфокусовані допоміжні функції налаштування OpenAI-сумісних саморозміщених провайдерів |
    | `plugin-sdk/cli-backend` | Стандартні параметри бекенда CLI + константи watchdog |
    | `plugin-sdk/provider-auth-runtime` | Runtime-допоміжні функції розв’язання API-ключів для Plugin провайдерів |
    | `plugin-sdk/provider-auth-api-key` | Допоміжні функції onboarding/API-key для запису профілю, як-от `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Стандартний побудовник результату OAuth-автентифікації |
    | `plugin-sdk/provider-auth-login` | Спільні допоміжні функції інтерактивного входу для Plugin провайдерів |
    | `plugin-sdk/provider-env-vars` | Допоміжні функції пошуку env-var автентифікації провайдера |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, застарілий compat-експорт `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, спільні побудовники replay-policy, допоміжні функції provider-endpoint і допоміжні функції нормалізації model-id, як-от `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Runtime-хук доповнення каталогу провайдера та межі реєстру plugin-provider для контрактних тестів |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Загальні допоміжні функції можливостей HTTP/endpoint провайдера, HTTP-помилки провайдера та допоміжні функції multipart-форми для аудіотранскрипції |
    | `plugin-sdk/provider-web-fetch-contract` | Вузькі допоміжні функції контракту конфігурації/вибору web-fetch, як-от `enablePluginInConfig` і `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Допоміжні функції реєстрації/кешу web-fetch провайдера |
    | `plugin-sdk/provider-web-search-config-contract` | Вузькі допоміжні функції конфігурації/облікових даних web-search для провайдерів, яким не потрібне підключення ввімкнення Plugin |
    | `plugin-sdk/provider-web-search-contract` | Вузькі допоміжні функції контракту конфігурації/облікових даних web-search, як-от `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, а також scoped setters/getters для облікових даних |
    | `plugin-sdk/provider-web-search` | Допоміжні функції реєстрації/кешу/runtime web-search провайдера |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, очищення схеми Gemini + діагностика, а також compat-допоміжні функції xAI, як-от `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` і подібні |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, типи stream wrapper і спільні допоміжні функції wrapper для Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Допоміжні функції нативного транспорту провайдера, як-от захищений fetch, перетворення транспортних повідомлень і записувані потоки транспортних подій |
    | `plugin-sdk/provider-onboard` | Допоміжні функції patch для конфігурації onboarding |
    | `plugin-sdk/global-singleton` | Допоміжні функції локальних для процесу singleton/map/cache |
    | `plugin-sdk/group-activation` | Вузький режим активації групи та допоміжні функції розбору команд |
  </Accordion>

  <Accordion title="Підшляхи автентифікації та безпеки">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, допоміжні функції реєстру команд, зокрема форматування динамічного меню аргументів, допоміжні функції авторизації відправника |
    | `plugin-sdk/command-status` | Побудовники повідомлень команд/довідки, як-от `buildCommandsMessagePaginated` і `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Допоміжні функції розв’язання approver і action-auth у тому самому чаті |
    | `plugin-sdk/approval-client-runtime` | Допоміжні функції профілю/фільтра нативного exec-схвалення |
    | `plugin-sdk/approval-delivery-runtime` | Адаптери можливостей/доставки нативного схвалення |
    | `plugin-sdk/approval-gateway-runtime` | Спільна допоміжна функція розв’язання Gateway для схвалення |
    | `plugin-sdk/approval-handler-adapter-runtime` | Легкі допоміжні функції завантаження адаптера нативного схвалення для гарячих точок входу каналів |
    | `plugin-sdk/approval-handler-runtime` | Ширші runtime-допоміжні функції обробника схвалень; віддавайте перевагу вужчим межам adapter/gateway, коли їх достатньо |
    | `plugin-sdk/approval-native-runtime` | Допоміжні функції цілі нативного схвалення + прив’язки облікового запису |
    | `plugin-sdk/approval-reply-runtime` | Допоміжні функції reply payload для схвалення exec/plugin |
    | `plugin-sdk/approval-runtime` | Допоміжні функції approval payload для exec/plugin, допоміжні функції маршрутизації/runtime нативного схвалення та допоміжні функції структурованого відображення схвалення, як-от `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Вузькі допоміжні функції скидання дедуплікації вхідних відповідей |
    | `plugin-sdk/channel-contract-testing` | Вузькі допоміжні функції тестування контракту каналу без широкого testing barrel |
    | `plugin-sdk/command-auth-native` | Нативна автентифікація команд, форматування динамічного меню аргументів і допоміжні функції нативної цілі сеансу |
    | `plugin-sdk/command-detection` | Спільні допоміжні функції виявлення команд |
    | `plugin-sdk/command-primitives-runtime` | Легкі предикати тексту команд для гарячих шляхів каналів |
    | `plugin-sdk/command-surface` | Нормалізація тіла команди та допоміжні функції command-surface |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Вузькі допоміжні функції збирання secret-contract для поверхонь секретів channel/plugin |
    | `plugin-sdk/secret-ref-runtime` | Вузькі `coerceSecretRef` і допоміжні функції типізації SecretRef для розбору secret-contract/config |
    | `plugin-sdk/security-runtime` | Спільні допоміжні функції довіри, обмеження DM, root-bounded файлів/шляхів, зокрема записи лише для створення, синхронна/асинхронна атомарна заміна файлів, записи sibling temp, fallback для переміщення між пристроями, допоміжні функції private file-store, guards для symlink-parent, external-content, редагування чутливого тексту, порівняння секретів за сталий час і допоміжні функції збирання секретів |
    | `plugin-sdk/ssrf-policy` | Допоміжні функції allowlist хостів і політики SSRF для приватної мережі |
    | `plugin-sdk/ssrf-dispatcher` | Вузькі допоміжні функції pinned-dispatcher без широкої runtime-поверхні інфраструктури |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, SSRF-захищений fetch, помилка SSRF і допоміжні функції політики SSRF |
    | `plugin-sdk/secret-input` | Допоміжні функції розбору введення секретів |
    | `plugin-sdk/webhook-ingress` | Допоміжні функції Webhook-запиту/цілі та приведення raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Допоміжні функції розміру/таймауту тіла запиту |
  </Accordion>

  <Accordion title="Підшляхи runtime і сховища">
    | Підшлях | Ключові експорти |
    | --- | --- |
    | `plugin-sdk/runtime` | Широкі помічники runtime, логування, резервного копіювання та встановлення Plugin |
    | `plugin-sdk/runtime-env` | Вузькі помічники середовища runtime, логера, тайм-ауту, повторних спроб і backoff |
    | `plugin-sdk/browser-config` | Підтримуваний фасад конфігурації браузера для нормалізованого профілю/типових значень, розбору CDP URL і помічників автентифікації керування браузером |
    | `plugin-sdk/channel-runtime-context` | Загальні помічники реєстрації та пошуку runtime-контексту каналу |
    | `plugin-sdk/matrix` | Застарілий фасад сумісності Matrix для старіших сторонніх пакетів каналів; нові plugins мають імпортувати `plugin-sdk/run-command` напряму |
    | `plugin-sdk/mattermost` | Застарілий фасад сумісності Mattermost для старіших сторонніх пакетів каналів; нові plugins мають імпортувати загальні підшляхи SDK напряму |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Спільні помічники команд Plugin, hook, http та інтерактивних режимів |
    | `plugin-sdk/hook-runtime` | Спільні помічники конвеєра Webhook/внутрішніх hook |
    | `plugin-sdk/lazy-runtime` | Помічники лінивого імпорту/прив’язування runtime, як-от `createLazyRuntimeModule`, `createLazyRuntimeMethod` і `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Помічники виконання процесів |
    | `plugin-sdk/cli-runtime` | Помічники форматування CLI, очікування, версії, виклику аргументів і лінивих груп команд |
    | `plugin-sdk/gateway-runtime` | Клієнт Gateway, помічник запуску клієнта з готовим циклом подій, Gateway CLI RPC, помилки протоколу Gateway і помічники патчів статусу каналу |
    | `plugin-sdk/config-types` | Поверхня конфігурації лише для типів для форм конфігурації Plugin, як-от `OpenClawConfig`, і типів конфігурації каналів/провайдерів |
    | `plugin-sdk/plugin-config-runtime` | Помічники пошуку конфігурації Plugin у runtime, як-от `requireRuntimeConfig`, `resolvePluginConfigObject` і `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Помічники транзакційної мутації конфігурації, як-от `mutateConfigFile`, `replaceConfigFile` і `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Помічники знімка конфігурації поточного процесу, як-от `getRuntimeConfig`, `getRuntimeConfigSnapshot`, і сетери тестових знімків |
    | `plugin-sdk/telegram-command-config` | Нормалізація імен/описів команд Telegram і перевірки дублікатів/конфліктів, навіть коли поверхня контракту вбудованого Telegram недоступна |
    | `plugin-sdk/text-autolink-runtime` | Виявлення автопосилань на файлові посилання без широкого barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Помічники схвалення exec/Plugin, білдери можливостей схвалення, помічники auth/profile, помічники native routing/runtime і форматування шляху відображення структурованого схвалення |
    | `plugin-sdk/reply-runtime` | Спільні помічники runtime для вхідних повідомлень/відповідей, розбиття на фрагменти, диспетчеризації, Heartbeat, планувальника відповідей |
    | `plugin-sdk/reply-dispatch-runtime` | Вузькі помічники диспетчеризації/завершення відповідей і міток розмов |
    | `plugin-sdk/reply-history` | Спільні помічники історії відповідей короткого вікна та маркери, як-от `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` і `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Вузькі помічники розбиття тексту/markdown на фрагменти |
    | `plugin-sdk/session-store-runtime` | Помічники шляху сховища сесій, ключа сесії, часу оновлення та мутації сховища |
    | `plugin-sdk/cron-store-runtime` | Помічники шляху/завантаження/збереження сховища Cron |
    | `plugin-sdk/state-paths` | Помічники шляхів каталогів стану/OAuth |
    | `plugin-sdk/routing` | Помічники маршруту/ключа сесії/прив’язування облікового запису, як-от `resolveAgentRoute`, `buildAgentSessionKey` і `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Спільні помічники зведення статусу каналу/облікового запису, типові значення runtime-state і помічники метаданих проблем |
    | `plugin-sdk/target-resolver-runtime` | Спільні помічники розпізнавача цілей |
    | `plugin-sdk/string-normalization-runtime` | Помічники нормалізації slug/рядків |
    | `plugin-sdk/request-url` | Витягування рядкових URL з fetch/request-подібних входів |
    | `plugin-sdk/run-command` | Виконавець команд із тайм-аутом і нормалізованими результатами stdout/stderr |
    | `plugin-sdk/param-readers` | Спільні читачі параметрів інструментів/CLI |
    | `plugin-sdk/tool-payload` | Витягування нормалізованих payload з об’єктів результатів інструментів |
    | `plugin-sdk/tool-send` | Витягування канонічних полів цілі надсилання з аргументів інструменту |
    | `plugin-sdk/temp-path` | Спільні помічники шляхів тимчасових завантажень і приватні захищені тимчасові робочі простори |
    | `plugin-sdk/logging-core` | Помічники логера підсистеми та редагування чутливих даних |
    | `plugin-sdk/markdown-table-runtime` | Помічники режиму та перетворення таблиць Markdown |
    | `plugin-sdk/model-session-runtime` | Помічники перевизначення моделі/сесії, як-от `applyModelOverrideToSessionEntry` і `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Помічники розв’язання конфігурації провайдера Talk |
    | `plugin-sdk/json-store` | Невеликі помічники читання/запису стану JSON |
    | `plugin-sdk/file-lock` | Помічники повторно вхідного file-lock |
    | `plugin-sdk/persistent-dedupe` | Помічники дискового кешу дедуплікації |
    | `plugin-sdk/acp-runtime` | Помічники runtime/session і диспетчеризації відповідей ACP |
    | `plugin-sdk/acp-runtime-backend` | Легковагові помічники реєстрації backend ACP і диспетчеризації відповідей для plugins, завантажених під час запуску |
    | `plugin-sdk/acp-binding-resolve-runtime` | Розв’язання прив’язок ACP лише для читання без імпортів запуску життєвого циклу |
    | `plugin-sdk/agent-config-primitives` | Вузькі примітиви схеми конфігурації runtime агента |
    | `plugin-sdk/boolean-param` | Нестрогий читач булевого параметра |
    | `plugin-sdk/dangerous-name-runtime` | Помічники розв’язання зіставлення небезпечних імен |
    | `plugin-sdk/device-bootstrap` | Помічники bootstrap пристрою та токена pairing |
    | `plugin-sdk/extension-shared` | Спільні примітиви помічників пасивного каналу, статусу та ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Помічники відповідей команди/провайдера `/models` |
    | `plugin-sdk/skill-commands-runtime` | Помічники перелічення команд Skills |
    | `plugin-sdk/native-command-registry` | Помічники реєстру/побудови/серіалізації native-команд |
    | `plugin-sdk/agent-harness` | Експериментальна поверхня trusted-plugin для низькорівневих harness агентів: типи harness, помічники керування/переривання активного запуску, помічники bridge інструментів OpenClaw, помічники політики інструментів runtime-plan, класифікація результатів термінала, помічники форматування/деталізації прогресу інструментів і утиліти результатів спроб |
    | `plugin-sdk/provider-zai-endpoint` | Помічники виявлення endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Помічник локального для процесу async lock для невеликих файлів стану runtime |
    | `plugin-sdk/channel-activity-runtime` | Помічник телеметрії активності каналу |
    | `plugin-sdk/concurrency-runtime` | Помічник обмеженої конкурентності асинхронних задач |
    | `plugin-sdk/dedupe-runtime` | Помічники кешу дедуплікації в пам’яті |
    | `plugin-sdk/delivery-queue-runtime` | Помічник drain для вихідних pending-delivery |
    | `plugin-sdk/file-access-runtime` | Помічники безпечних шляхів локальних файлів і media-source |
    | `plugin-sdk/heartbeat-runtime` | Помічники подій Heartbeat і видимості |
    | `plugin-sdk/number-runtime` | Помічник числового приведення |
    | `plugin-sdk/secure-random-runtime` | Помічники захищених токенів/UUID |
    | `plugin-sdk/system-event-runtime` | Помічники черги системних подій |
    | `plugin-sdk/transport-ready-runtime` | Помічник очікування готовності транспорту |
    | `plugin-sdk/infra-runtime` | Застарілий shim сумісності; використовуйте зосереджені підшляхи runtime вище |
    | `plugin-sdk/collection-runtime` | Невеликі помічники обмеженого кешу |
    | `plugin-sdk/diagnostic-runtime` | Помічники діагностичних прапорів, подій і trace-context |
    | `plugin-sdk/error-runtime` | Помічники графа помилок, форматування та спільної класифікації помилок, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Обгорнутий fetch, proxy, опція EnvHttpProxyAgent і помічники pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch із підтримкою dispatcher без імпортів proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Обмежений читач response-body без широкої поверхні media runtime |
    | `plugin-sdk/session-binding-runtime` | Поточний стан прив’язки розмови без налаштованої маршрутизації прив’язок або pairing-сховищ |
    | `plugin-sdk/session-store-runtime` | Помічники сховища сесій без широких імпортів запису/обслуговування конфігурації |
    | `plugin-sdk/context-visibility-runtime` | Розв’язання видимості контексту та фільтрування додаткового контексту без широких імпортів конфігурації/безпеки |
    | `plugin-sdk/string-coerce-runtime` | Вузькі помічники приведення й нормалізації primitive record/рядків без імпортів markdown/логування |
    | `plugin-sdk/host-runtime` | Помічники нормалізації hostname і SCP host |
    | `plugin-sdk/retry-runtime` | Помічники конфігурації повторних спроб і виконавця повторних спроб |
    | `plugin-sdk/agent-runtime` | Помічники каталогу/ідентичності/робочого простору агента, включно з `resolveAgentDir`, `resolveDefaultAgentDir` і застарілим експортом сумісності `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Запит/дедуплікація каталогів на основі конфігурації |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Підшляхи можливостей і тестування">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Спільні помічники для отримання, перетворення та зберігання медіа, визначення розмірів відео на основі ffprobe, а також побудовники медіа-навантажень |
    | `plugin-sdk/media-store` | Вузькі помічники медіасховища, як-от `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Спільні помічники резервного перемикання генерації медіа, вибору кандидатів і повідомлень про відсутні моделі |
    | `plugin-sdk/media-understanding` | Типи провайдерів розуміння медіа, а також експорти помічників для зображень/аудіо, призначені для провайдерів |
    | `plugin-sdk/text-runtime` | Спільні помічники для тексту/markdown/логування, як-от видалення видимого для асистента тексту, помічники рендерингу/розбиття/таблиць markdown, помічники редагування, помічники тегів директив і утиліти безпечного тексту |
    | `plugin-sdk/text-chunking` | Помічник розбиття вихідного тексту |
    | `plugin-sdk/speech` | Типи провайдерів мовлення, а також експорти директив, реєстру, валідації, OpenAI-сумісного побудовника TTS і помічників мовлення, призначені для провайдерів |
    | `plugin-sdk/speech-core` | Спільні типи провайдерів мовлення, реєстр, директиви, нормалізація та експорти помічників мовлення |
    | `plugin-sdk/realtime-transcription` | Типи провайдерів транскрипції в реальному часі, помічники реєстру та спільний помічник сеансу WebSocket |
    | `plugin-sdk/realtime-voice` | Типи провайдерів голосу в реальному часі та помічники реєстру |
    | `plugin-sdk/image-generation` | Типи провайдерів генерації зображень, а також помічники URL-адрес ресурсів/даних зображень і OpenAI-сумісний побудовник провайдера зображень |
    | `plugin-sdk/image-generation-core` | Спільні типи генерації зображень, резервне перемикання, автентифікація та помічники реєстру |
    | `plugin-sdk/music-generation` | Типи провайдерів/запитів/результатів генерації музики |
    | `plugin-sdk/music-generation-core` | Спільні типи генерації музики, помічники резервного перемикання, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/video-generation` | Типи провайдерів/запитів/результатів генерації відео |
    | `plugin-sdk/video-generation-core` | Спільні типи генерації відео, помічники резервного перемикання, пошук провайдера та розбір посилань на моделі |
    | `plugin-sdk/webhook-targets` | Реєстр цілей Webhook і помічники встановлення маршрутів |
    | `plugin-sdk/webhook-path` | Помічники нормалізації шляху Webhook |
    | `plugin-sdk/web-media` | Спільні помічники завантаження віддалених/локальних медіа |
    | `plugin-sdk/zod` | Повторно експортований `zod` для споживачів SDK Plugin |
    | `plugin-sdk/testing` | Широкий barrel сумісності для застарілих тестів plugin. Нові тести розширень мають натомість імпортувати цільові підшляхи SDK, як-от `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` або `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Мінімальний помічник `createTestPluginApi` для модульних тестів прямої реєстрації plugin без імпорту мостів тестових помічників репозиторію |
    | `plugin-sdk/agent-runtime-test-contracts` | Нативні фікстури контрактів адаптера середовища виконання агента для тестів автентифікації, доставки, резервного сценарію, хуків інструментів, накладання промпта, схеми та проєкції транскрипту |
    | `plugin-sdk/channel-test-helpers` | Орієнтовані на канали тестові помічники для загальних контрактів дій/налаштування/статусу, перевірок каталогу, життєвого циклу запуску облікового запису, потоків send-config, моків середовища виконання, проблем статусу, вихідної доставки та реєстрації хуків |
    | `plugin-sdk/channel-target-testing` | Спільний набір випадків помилок розв’язання цілі для тестів каналів |
    | `plugin-sdk/plugin-test-contracts` | Помічники контрактів пакета plugin, реєстрації, публічного артефакту, прямого імпорту, API середовища виконання та побічних ефектів імпорту |
    | `plugin-sdk/provider-test-contracts` | Помічники контрактів середовища виконання провайдера, автентифікації, виявлення, onboard, каталогу, майстра, можливостей медіа, політики replay, realtime STT live-audio, web-search/fetch і stream |
    | `plugin-sdk/provider-http-test-mocks` | Опціональні HTTP/auth моки Vitest для тестів провайдерів, які перевіряють `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Загальні фікстури захоплення середовища виконання CLI, контексту пісочниці, записувача Skills, agent-message, system-event, перезавантаження модуля, шляху вбудованого plugin, terminal-text, chunking, auth-token і typed-case |
    | `plugin-sdk/test-node-mocks` | Цільові помічники моків вбудованих модулів Node для використання всередині фабрик Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Підшляхи пам’яті">
    | Підшлях | Основні експорти |
    | --- | --- |
    | `plugin-sdk/memory-core` | Поверхня вбудованих помічників memory-core для помічників manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Фасад середовища виконання індексу/пошуку пам’яті |
    | `plugin-sdk/memory-core-host-engine-foundation` | Експорти базового рушія хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Контракти вбудовувань хоста пам’яті, доступ до реєстру, локальний провайдер і загальні batch/remote помічники |
    | `plugin-sdk/memory-core-host-engine-qmd` | Експорти рушія QMD хоста пам’яті |
    | `plugin-sdk/memory-core-host-engine-storage` | Експорти рушія сховища хоста пам’яті |
    | `plugin-sdk/memory-core-host-multimodal` | Мультимодальні помічники хоста пам’яті |
    | `plugin-sdk/memory-core-host-query` | Помічники запитів хоста пам’яті |
    | `plugin-sdk/memory-core-host-secret` | Помічники секретів хоста пам’яті |
    | `plugin-sdk/memory-core-host-events` | Помічники журналу подій хоста пам’яті |
    | `plugin-sdk/memory-core-host-status` | Помічники статусу хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-cli` | Помічники середовища виконання CLI хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-core` | Помічники основного середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-core-host-runtime-files` | Помічники файлів/середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-host-core` | Нейтральний щодо постачальника псевдонім для помічників основного середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-host-events` | Нейтральний щодо постачальника псевдонім для помічників журналу подій хоста пам’яті |
    | `plugin-sdk/memory-host-files` | Нейтральний щодо постачальника псевдонім для помічників файлів/середовища виконання хоста пам’яті |
    | `plugin-sdk/memory-host-markdown` | Спільні помічники керованого markdown для суміжних із пам’яттю plugins |
    | `plugin-sdk/memory-host-search` | Фасад середовища виконання активної пам’яті для доступу до search-manager |
    | `plugin-sdk/memory-host-status` | Нейтральний щодо постачальника псевдонім для помічників статусу хоста пам’яті |
  </Accordion>

  <Accordion title="Зарезервовані підшляхи вбудованих помічників">
    Наразі немає зарезервованих підшляхів SDK для вбудованих помічників. Специфічні
    для власника помічники розміщуються всередині пакета plugin власника, тоді як багаторазові контракти хоста
    використовують загальні підшляхи SDK, як-от `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` і `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд SDK Plugin](/uk/plugins/sdk-overview)
- [Налаштування SDK Plugin](/uk/plugins/sdk-setup)
- [Створення plugins](/uk/plugins/building-plugins)
